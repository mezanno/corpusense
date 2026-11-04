import { BaseError } from '@/utils/BaseError';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InvalidTaskScopeError,
  JobPostError,
  ManifestForbiddenError,
  manifestHttpError,
  ManifestHttpError,
  ManifestImportError,
  ManifestNotFoundError,
  PluginApiError,
  SupabaseStorageError,
} from '../errors';
import defaultImporter from '../importers/default';

describe('manifestHttpError', () => {
  const url = 'https://example.org/manifest.json';

  it.each([
    { status: 404, expected: ManifestNotFoundError },
    { status: 403, expected: ManifestForbiddenError },
  ])('names the $status failure its own class', ({ status, expected }) => {
    const error = manifestHttpError(url, { status, statusText: 'Whatever' });

    expect(error).toBeInstanceOf(expected);
    expect(error.context).toEqual({ url });
  });

  it('keeps status and status text as context for any other status', () => {
    const error = manifestHttpError(url, { status: 502, statusText: 'Bad Gateway' });

    expect(error).toBeInstanceOf(ManifestHttpError);
    expect(error.context).toEqual({ url, status: 502, statusText: 'Bad Gateway' });
  });
});

describe('default importer', () => {
  const url = 'https://example.org/manifest.json';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets an HTTP failure through as the typed error, not as an unknown one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: '' }));

    await expect(defaultImporter(url)).rejects.toBeInstanceOf(ManifestNotFoundError);
  });

  it('names the url when the failure has no class of its own', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await defaultImporter(url).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ManifestImportError);
    expect((error as Error).message).toContain(url);
    expect((error as BaseError).context).toEqual({ url, cause: 'Failed to fetch' });
  });
});

describe('plugin errors', () => {
  it('put the job coordinates in the persisted message', () => {
    const error = new JobPostError({
      plugin: 'layoutExtraction',
      workerId: 'worker-1',
      taskId: 3,
      cause: 'insert blocked',
    });

    expect(error.message).toContain('layoutExtraction');
    expect(error.message).toContain('worker-1');
    expect(error.message).toContain('3');
    expect(error.context).toMatchObject({ plugin: 'layoutExtraction', taskId: 3 });
  });

  it('keeps an oversized API body out of the message but in the context', () => {
    const body = 'x'.repeat(400);
    const error = new PluginApiError({
      plugin: 'mistralocr',
      status: 500,
      statusText: 'Internal Server Error',
      body,
    });

    expect(error.message.length).toBeLessThan(body.length);
    expect((error.context as { body: string }).body).toBe(body);
  });

  it('describes a refused storage write by action and path', () => {
    const error = new SupabaseStorageError({
      action: 'delete',
      filePath: 'uploads/abc',
      cause: 'row not found',
    });

    expect(error.message).toContain('delete uploads/abc');
    expect(error.context).toEqual({
      action: 'delete',
      filePath: 'uploads/abc',
      cause: 'row not found',
    });
  });

  it('reports an unexpected scope as a task failure, with the scope it got', () => {
    const error = new InvalidTaskScopeError({
      plugin: 'customWorker',
      taskId: 7,
      scope: 'collection:collection-1',
    });

    expect(error.message).toBe('error_task_invalid_scope');
    expect(error.context).toEqual({
      plugin: 'customWorker',
      taskId: 7,
      scope: 'collection:collection-1',
    });
  });
});
