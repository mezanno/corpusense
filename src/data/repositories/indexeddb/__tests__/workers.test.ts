import type { Worker } from '@/data/models/worker/worker';
import { TaskStatus, WorkerStatus } from '@/data/models/worker/worker';
import { StatusChangeError, WorkerEvent } from '@/data/models/worker/workerStatusLaw';
import Dexie from 'dexie';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { db } from '../db';
import type { WorkerRepository } from '../types';
import { IndexedDBWorkerRepository } from '../workers';
import { createTestDb } from './testDb';

const workerTableSchema = '&id, name, status, [scopeKey+name]';

async function createVersion31Database(workers: unknown[]) {
  db.close();
  await Dexie.delete('mezanno');

  const legacyDb = new Dexie('mezanno');
  legacyDb.version(31).stores({
    collections: '&id, name, *tags.id',
    collectionContents: '&id',
    history: '&url',
    storedManifests: '&id, name',
    storedManifestContents: '&id',
    typesList: '&label',
    itemMetadata: '[id+attribute.label]',
    tags: '&id',
    models: '&id, name',
    annotations:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type], [collectionId+type]',
    annotationsTemp:
      '&id, canvasId, collectionId, [canvasId+collectionId], order, [canvasId+collectionId+type]',
    namedEntities: '&id, *annotationIds, type.id',
    results: '++id, workerName, workerId, [scopeKey+workerName], taskId, [workerId+taskId]',
    workers: workerTableSchema,
    handles: '&id',
    convertedFiles: '&id, folderName',
    modifierChains: '&id, name',
    projects: '&id, name',
    sources: '&id, name, type',
    sourceContents: '&id',
    storedBlobs: '&id',
  });
  await legacyDb.open();
  await legacyDb.table('workers').bulkAdd(workers);
  legacyDb.close();
}

const legacyWorker = (
  id: string,
  status: string,
  queue: { id: number; scope: { collectionId: string; canvasId: string }; status: string }[] = [],
) => ({
  id,
  name: 'legacy-worker',
  scope: { collectionId: 'collection-1' },
  params: {},
  scopeKey: 'collection-1',
  status,
  createdAt: '2026-01-01T00:00:00.000Z',
  estimatedDuration: 0,
  queue,
});

const legacyTask = (id: number, status: string) => ({
  id,
  scope: { collectionId: 'collection-1', canvasId: `canvas-${id}` },
  status,
});

describe('IndexedDBWorkerRepository status characterization', () => {
  const repository = new IndexedDBWorkerRepository();

  beforeEach(async () => {
    await createTestDb();
  });

  it('persists a task transition and derives the worker status', async () => {
    await repository.add(
      {
        id: 'worker-1',
        name: 'test-worker',
        scope: { collectionId: 'collection-1' },
        params: {},
      },
      [
        {
          id: 0,
          scope: { collectionId: 'collection-1', canvasId: 'canvas-1' },
          status: TaskStatus.WAITING,
        },
      ],
    );

    const started = await repository.updateTaskStatus('worker-1', 0, { type: WorkerEvent.START });
    const completed = await repository.updateTaskStatus('worker-1', 0, {
      type: WorkerEvent.RESULT_OK,
    });
    const worker = await repository.getById('worker-1');

    expect(started.ok).toBe(true);
    expect(completed.ok).toBe(true);
    expect(worker.ok && worker.value.status).toBe(WorkerStatus.COMPLETED);
    expect(worker.ok && worker.value.queue[0].status).toBe(TaskStatus.COMPLETED);
  });

  it('rejects a task status transition that violates the current repository rules', async () => {
    await repository.add(
      {
        id: 'worker-2',
        name: 'test-worker',
        scope: { collectionId: 'collection-1' },
        params: {},
      },
      [
        {
          id: 0,
          scope: { collectionId: 'collection-1', canvasId: 'canvas-1' },
          status: TaskStatus.WAITING,
        },
      ],
    );

    const result = await repository.updateTaskStatus('worker-2', 0, {
      type: WorkerEvent.JOB_ACCEPTED,
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBeInstanceOf(StatusChangeError);
  });

  it('migrates v31 task and worker alphabets into v32', async () => {
    await createVersion31Database([
      legacyWorker('failed-worker', 'posted', [
        legacyTask(0, 'error'),
        legacyTask(1, TaskStatus.COMPLETED),
      ]),
      legacyWorker('empty-failed-worker', 'error'),
      legacyWorker('empty-posted-worker', 'posted'),
      legacyWorker('unfinished-worker', 'unfinished', [legacyTask(0, 'error')]),
    ]);

    await db.open();
    const workers = await db.workers.toArray();
    const byId = new Map(workers.map((worker) => [worker.id, worker]));

    expect(byId.get('failed-worker')?.queue[0].status).toBe(TaskStatus.COMPLETED_WITH_ERRORS);
    expect(byId.get('failed-worker')?.status).toBe(WorkerStatus.COMPLETED_WITH_ERRORS);
    expect(byId.get('empty-failed-worker')?.status).toBe(WorkerStatus.COMPLETED_WITH_ERRORS);
    expect(byId.get('empty-posted-worker')?.status).toBe(WorkerStatus.INPROGRESS);
    expect(byId.get('unfinished-worker')?.queue[0].status).toBe(TaskStatus.COMPLETED_WITH_ERRORS);
    expect(byId.get('unfinished-worker')?.status).toBe(WorkerStatus.UNFINISHED);
  });

  it('rejects unknown persisted task statuses instead of silently coercing them', async () => {
    await createVersion31Database([
      legacyWorker('unknown-worker', 'posted', [legacyTask(0, 'cancelled')]),
    ]);

    await expect(db.open()).rejects.toThrow('Unknown persisted task status during migration');
  });

  it('rejects unknown persisted worker statuses even when tasks can be derived', async () => {
    await createVersion31Database([
      legacyWorker('unknown-worker', 'cancelled', [legacyTask(0, TaskStatus.WAITING)]),
    ]);

    await expect(db.open()).rejects.toThrow('Unknown persisted worker status during migration');
  });
});

describe('WorkerRepository type surface', () => {
  it('does not expose worker status or queue through patch()', () => {
    expectTypeOf<Parameters<WorkerRepository['patch']>[1]>().toEqualTypeOf<
      Partial<Omit<Worker, 'status' | 'queue'>>
    >();
  });
});
