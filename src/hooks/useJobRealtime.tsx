import { workerPlugins } from '@/App';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { Worker, WorkerStatus } from '@/data/models/Worker';
import { getWorkerRepository } from '@/data/repositories/indexeddb/dbFactory';
import { updateTaskStatus } from '@/data/utils/worker';
import { JobRow, supabase } from '@/utils/config';
import {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

const useJobRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { getPostedWorkers } = useWorkerContext();

  const workersPosted = getPostedWorkers();
  const workersPostedRef = useRef(workersPosted);

  useEffect(() => {
    workersPostedRef.current = workersPosted;
  }, [workersPosted]);

  useEffect(() => {
    /**
     * Processes a single task update from a Supabase JobRow.
     * Updates the local IndexedDB and determines the overall worker status.
     * Deletes completed jobs from Supabase.
     */
    const processSingleTask = async (worker: Worker, job: JobRow) => {
      const workerRepository = getWorkerRepository();
      const task = worker.queue.find((t) => t.id === job.task_id);

      if (!task) {
        console.warn(`Task not found in worker ${worker.id} for task_id: ${job.task_id}`);
        return worker;
      }

      // Map Supabase job status to WorkerStatus
      const statusMap: Record<string, WorkerStatus> = {
        pending: WorkerStatus.POSTED,
        processing: WorkerStatus.INPROGRESS,
        failed: WorkerStatus.ERROR,
        completed: WorkerStatus.COMPLETED,
      };
      let taskStatus = statusMap[job.status] ?? WorkerStatus.ERROR;
      let statusMessage = '';

      // Skip processing if task is already finished locally, but ensure completed jobs are deleted from Supabase
      if (task.status === WorkerStatus.COMPLETED || task.status === WorkerStatus.ERROR) {
        if (job.status === 'completed') {
          await supabase.from('cs_jobs').delete().eq('task_id', task.id).eq('worker_id', worker.id);
        }
        return worker;
      }

      // Handle successful results
      if (job.status === 'completed') {
        const plugin = workerPlugins[job.plugin_name];
        if (job.result !== null && plugin?.processResult) {
          try {
            const response = await plugin.processResult(job.result, task);
            if (response.status === WorkerStatus.ERROR) {
              taskStatus = WorkerStatus.ERROR;
              statusMessage = response.statusMessage ?? 'Plugin processing error';
            }
          } catch (error) {
            console.error(`Error in processResult for plugin ${job.plugin_name}:`, error);
            taskStatus = WorkerStatus.ERROR;
            statusMessage = 'Result processing failed';
          }
        }
      } else if (job.status === 'failed') {
        // Handle failures
        statusMessage = typeof job.error === 'string' ? job.error : JSON.stringify(job.error);
      }

      // Update the local queue
      const updatedQueue = updateTaskStatus(worker.queue, task.id, taskStatus, statusMessage);

      // Determine the overall worker status based on the entire queue
      const allFinished = updatedQueue.every(
        (t) => t.status === WorkerStatus.COMPLETED || t.status === WorkerStatus.ERROR,
      );
      const anyError = updatedQueue.some((t) => t.status === WorkerStatus.ERROR);

      let overallStatus: WorkerStatus;
      if (allFinished) {
        overallStatus = anyError ? WorkerStatus.COMPLETED_WITH_ERRORS : WorkerStatus.COMPLETED;
      } else {
        // If not all tasks are finished, it's either in progress or in progress with errors
        overallStatus = anyError ? WorkerStatus.INPROGRESS_WITH_ERRORS : WorkerStatus.INPROGRESS;
      }

      const updatedWorker = {
        ...worker,
        status: overallStatus,
        queue: updatedQueue,
      };

      // Persist changes to IndexedDB
      await workerRepository.patch(updatedWorker.id, {
        status: updatedWorker.status,
        queue: updatedWorker.queue,
      });

      // Remove completed job from Supabase to signal completion
      if (job.status === 'completed') {
        const { error } = await supabase
          .from('cs_jobs')
          .delete()
          .eq('task_id', task.id)
          .eq('worker_id', worker.id);

        if (error) console.error('Error deleting processed job from Supabase:', error);
      }

      return updatedWorker;
    };

    /**
     * Fetches updates from Supabase for all workers currently in POSTED state.
     */
    const fetchJobUpdates = async () => {
      const postedWorkers = workersPostedRef.current;
      for (const worker of postedWorkers) {
        console.log('fetchJobUpdates ', worker.id);

        const { data, error } = await supabase
          .from('cs_jobs')
          .select('*')
          .eq('worker_id', worker.id);

        if (error) {
          console.error(`Error fetching updates for worker ${worker.id}:`, error);
          continue;
        }

        if (data?.length > 0) {
          let currentWorkerState = worker;
          for (const job of data) {
            currentWorkerState = await processSingleTask(currentWorkerState, job);
          }
        } else {
          //delete worker if no jobs are found in supabase
          const workerRepository = getWorkerRepository();
          await workerRepository.deleteById(worker.id);
        }
      }
    };

    /**
     * Handles live updates from Supabase Realtime.
     */
    const handleJobRowUpdate = async (payload: RealtimePostgresUpdatePayload<JobRow>) => {
      const job = payload.new;
      const workerRepository = getWorkerRepository();
      console.log('handleJobRowUpdate ', job);

      try {
        const worker = await workerRepository.getById(job.worker_id);
        await processSingleTask(worker, job);
      } catch (error) {
        console.error('Error processing realtime job update:', error);
      }
    };

    // Initialize Realtime Subscription
    const channel = supabase
      .channel('job-updates')
      .on<JobRow>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cs_jobs' },
        (payload) => void handleJobRowUpdate(payload),
      )
      .subscribe((status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log('Successfully subscribed to REALTIME job updates');
        }
      });

    channelRef.current = channel;

    // Trigger initial sync immediately
    void fetchJobUpdates();

    // Setup periodic polling every 20 seconds
    const interval = setInterval(() => {
      void fetchJobUpdates();
    }, 20000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
};

export default useJobRealtime;
