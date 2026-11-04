import { workerPlugins } from '@/App';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { TaskStatus, Worker, WorkerEvent } from '@/data/models/worker/worker';
import type { TaskEvent } from '@/data/models/worker/workerStatusLaw';
import {
  isTaskTerminal,
  isWorkerUnfinished,
  taskStatusOfJobStatus,
} from '@/data/models/worker/workerStatusLaw';
import { getWorkerRepository } from '@/data/repositories/indexeddb/dbFactory';
import { deleteFile } from '@/state/sagas/plugins/workers/supabase/utils';
import { JobRow, supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';
import z from 'zod';

const payloadSchema = z.object({
  url: z.string(),
});

const useJobRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const ctx = useWorkerContext();
  const { workers } = ctx;
  // Workers with at least one task in POSTED/INPROGRESS whose plugin runs jobs through Supabase
  // (executionStrategy 'job'): the only ones that can own rows in cs_jobs. Synchronous plugins
  // never create a row, so they never need a catch-up fetch.
  const trackedWorkersRef = useRef<Worker[]>([]);
  const fetchJobUpdatesRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    trackedWorkersRef.current = ctx
      .getWorkersWithTrackedJobs()
      .filter((worker) => workerPlugins[worker.name]?.executionStrategy === 'job');
    void fetchJobUpdatesRef.current?.();
  }, [workers]);

  useEffect(() => {
    // Per-worker mutex, implemented as a map: worker id -> last promise queued for that worker.
    // Why it is needed: processing a job reads the worker from IndexedDB, then writes back the
    // updated task queue. Two jobs of the same worker can arrive at the same time (a realtime
    // event and the 20 s catch-up, or two tasks finishing together). Without serialization,
    // both would read the same queue and the second write would overwrite the first one.
    const workerLocks = new Map<string, Promise<unknown>>();
    // Runs `task` only after every task previously queued for `workerId` has finished.
    // Different workers do not block each other.
    // - `previous.catch(() => undefined)`: a failure of the previous task must not prevent this
    //   one from running (the failure is still reported to the previous task's own caller).
    // - The `finally` removes the map entry when this task is still the last one queued, so the
    //   map does not grow forever. If another task was queued meanwhile, the entry is kept.
    // - The trailing `.catch(() => undefined)` only avoids an unhandled rejection on the
    //   cleanup chain; the caller still receives the real result or error through `run`.
    const withWorkerLock = <T,>(workerId: string, task: () => Promise<T>): Promise<T> => {
      const previous = workerLocks.get(workerId) ?? Promise.resolve();
      const run = previous.catch(() => undefined).then(task);
      workerLocks.set(workerId, run);
      void run
        .finally(() => {
          if (workerLocks.get(workerId) === run) workerLocks.delete(workerId);
        })
        .catch(() => undefined);
      return run;
    };

    // Ids of jobs already confirmed deleted from Supabase. Every IndexedDB write changes
    // `workers`, which triggers a new fetchJobUpdates; a fetch that started before the deletion
    // still holds a stale snapshot containing the job. Without this set, that stale job would be
    // processed again and its deletion retried for nothing. Ids are never reused, so it is safe.
    const deletedJobIds = new Set<number>();

    // Acknowledges a job: its result is already persisted in IndexedDB, so Supabase no longer
    // needs to keep it. First delete the uploaded file (only if the job succeeded), then the
    // cs_jobs row.
    const acknowledgeJob = async (job: JobRow, removeUpload: boolean) => {
      if (removeUpload) {
        try {
          const payload = payloadSchema.safeParse(job.payload);
          if (payload.success) {
            const id = payload.data.url.split('/').pop();
            if (id !== undefined) await deleteFile(`uploads/${id}`);
          }
        } catch (error) {
          // A failed file cleanup must not prevent the job row from being deleted
          console.error(`Error deleting upload of job ${job.id} from Supabase storage:`, error);
        }
      }

      // `.select('id')` returns the rows actually deleted: without it, a delete rejected by
      // RLS or matching no row would report neither an error nor any signal.
      const { data, error } = await supabase
        .from('cs_jobs')
        .delete()
        .eq('task_id', job.task_id)
        .eq('worker_id', job.worker_id)
        .select('id');
      if (error) {
        console.error(`Error deleting processed job ${job.id} from Supabase:`, error);
      } else if (data.length === 0) {
        console.warn(`Supabase job ${job.id} was not deleted (no matching row or delete denied)`);
      }
    };

    // Handles a Supabase job for a local task:
    // 1. find the worker/task in IndexedDB;
    // 2. map the job status to a task event;
    // 3. for a `completed` job, let the plugin process the result;
    // 4. persist the new state in IndexedDB (status law);
    // 5. acknowledge (delete) the job only once the terminal state is persisted.
    const processSingleTask = async (job: JobRow) => {
      // Checked inside the worker lock, so a deletion done by a previous queued task is seen.
      if (deletedJobIds.has(job.id)) return;
      const workerRepository = getWorkerRepository();
      const workerResult = await workerRepository.getById(job.worker_id);
      if (!workerResult.ok) {
        console.warn(`Worker not found: ${job.worker_id}`);
        return;
      }
      const worker = workerResult.value;
      const task = worker.queue.find((queuedTask) => queuedTask.id === job.task_id);
      if (!task) {
        console.warn(`Task not found in worker ${worker.id} for task_id: ${job.task_id}`);
        return;
      }

      const mappedStatus = taskStatusOfJobStatus(job.status);
      if (!mappedStatus.ok) {
        console.error('Unknown Supabase job status:', mappedStatus.error);
        return;
      }

      // Task already COMPLETED locally (e.g. a previous deletion failed): nothing to reprocess,
      // just retry the cleanup if the job is terminal.
      if (task.status === TaskStatus.COMPLETED) {
        if (isTaskTerminal(mappedStatus.value))
          await acknowledgeJob(job, job.status === 'completed');
        return;
      }

      // Interrupted worker: ignore intermediate updates (pending/processing), but a terminal
      // result must still be recorded.
      if (isWorkerUnfinished(worker.status) && !isTaskTerminal(mappedStatus.value)) {
        return;
      }

      let event: TaskEvent = {
        type: WorkerEvent.JOB_DELIVERED,
        jobStatus: job.status,
      };
      let statusMessage =
        job.status === 'failed'
          ? typeof job.error === 'string'
            ? job.error
            : JSON.stringify(job.error)
          : undefined;

      if (job.status === 'completed') {
        const plugin = workerPlugins[job.plugin_name];
        if (job.result !== null && plugin?.processResult) {
          try {
            const response = await plugin.processResult(job.result, task, job.worker_category);
            if (response.event === WorkerEvent.RESULT_ERR) {
              event = { type: WorkerEvent.RESULT_ERR };
              statusMessage = response.message ?? 'Plugin processing error';
            } else if (response.event === WorkerEvent.JOB_ACCEPTED) {
              console.error(`Result processor ${job.plugin_name} returned a job-accepted event`);
              event = { type: WorkerEvent.RESULT_ERR };
              statusMessage = 'Invalid result processor response';
            }
          } catch (error) {
            console.error(`Error in processResult for plugin ${job.plugin_name}:`, error);
            event = { type: WorkerEvent.RESULT_ERR };
            statusMessage =
              getErrorMessage(error) || `Result processing failed for ${job.plugin_name}`;
          }
        }
      }

      const updateResult = await workerRepository.updateTaskStatus(
        worker.id,
        task.id,
        event,
        statusMessage,
      );
      if (!updateResult.ok) {
        console.error('Unable to persist delivered job status:', updateResult.error);
        return;
      }

      // Delete the job only if the persisted state is terminal. The uploaded file is removed
      // only on full success; on error, keep everything for troubleshooting.
      if (isTaskTerminal(updateResult.value.status)) {
        await acknowledgeJob(
          job,
          job.status === 'completed' && updateResult.value.status === TaskStatus.COMPLETED,
        );
      }
    };

    // Catch-up: on mount, on every workers change and every 20 s, since realtime events can be
    // missed (disconnection, inactive tab). Jobs of the same worker run serially through
    // withWorkerLock.
    const fetchJobUpdates = async () => {
      const workerIds = trackedWorkersRef.current.map((worker) => worker.id);
      if (workerIds.length === 0) return;

      // The `in` filter travels in the GET URL: a single in.(...) with every worker id can grow
      // past the URL limit of Supabase's proxy, which then rejects the request with a 400.
      // Query the ids in chunks so each request stays small.
      const CHUNK_SIZE = 100;
      const jobs: JobRow[] = [];
      for (let i = 0; i < workerIds.length; i += CHUNK_SIZE) {
        const { data, error } = await supabase
          .from('cs_jobs')
          .select('*')
          .in('worker_id', workerIds.slice(i, i + CHUNK_SIZE));
        if (error) {
          console.error('Error fetching Supabase job updates:', error);
          return;
        }
        jobs.push(...(data ?? []));
      }

      for (const job of jobs) {
        try {
          await withWorkerLock(job.worker_id, () => processSingleTask(job));
        } catch (jobError) {
          console.error(`Error processing Supabase job ${job.id}:`, jobError);
        }
      }
    };

    const handleJobRowUpdate = async (payload: RealtimePostgresUpdatePayload<JobRow>) => {
      try {
        await withWorkerLock(payload.new.worker_id, () => processSingleTask(payload.new));
      } catch (error) {
        console.error('Error processing realtime job update:', error);
      }
    };

    // Realtime subscription: Supabase pushes every UPDATE of a cs_jobs row (the worker backend
    // changes `status`/`result` when a job progresses). Each update is processed under the
    // worker lock. Realtime is best-effort, hence the periodic fetchJobUpdates below.
    const channel = supabase
      .channel('job-updates')
      .on<JobRow>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cs_jobs' },
        (payload) => void handleJobRowUpdate(payload),
      )
      // `subscribe` calls back with the connection state of the channel. REALTIME_SUBSCRIBE_STATES
      // has SUBSCRIBED (listening), plus CLOSED, TIMED_OUT and CHANNEL_ERROR. Only SUBSCRIBED is
      // logged; on the other states updates may be missed until the next catch-up fetch.
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log('Successfully subscribed to REALTIME job updates');
        }
      });

    channelRef.current = channel;
    fetchJobUpdatesRef.current = fetchJobUpdates;
    void fetchJobUpdates();

    const interval = setInterval(() => {
      void fetchJobUpdates();
    }, 20000);

    return () => {
      clearInterval(interval);
      fetchJobUpdatesRef.current = null;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
};

export default useJobRealtime;
