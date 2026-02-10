import { workerPlugins } from '@/App';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { Task, Worker, WorkerStatus } from '@/data/models/Worker';
import { getWorkerRepository } from '@/data/repositories/indexeddb/dbFactory';
import { updateTaskStatus } from '@/data/utils/worker';
import { JobRow, supabase } from '@/utils/config';
import {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

const processResult = async (worker: Worker, task: Task, result: unknown) => {
  console.log('processResult for worker: ', worker);
  const workerRepository = getWorkerRepository();
  //process the result if status is completed or failed
  const plugin = workerPlugins[worker.name];
  if (plugin.processResult) {
    const response = await plugin.processResult(result, task);
    console.log('Processed worker result response:', response);
    if (response.status === WorkerStatus.COMPLETED) {
      worker = {
        ...worker,
        queue: updateTaskStatus(worker.queue, task.id, WorkerStatus.COMPLETED, ''), //on ajoute un message vide pour supprimer un potentiel précédent message d'erreur
      };
      await workerRepository.patch(worker.id, {
        status: worker.status,
        statusMessage: worker.statusMessage,
        queue: worker.queue,
      });
      const { data, error } = await supabase
        .from('cs_jobs')
        .delete()
        .eq('task_id', task.id)
        .eq('worker_id', worker.id);
      if (error) {
        console.error('Error deleting processed job from cs_jobs:', error);
      } else {
        console.log('Deleted processed job from cs_jobs:', data);
      }
    } else if (response.status === WorkerStatus.ERROR) {
      worker = {
        ...worker,
        queue: updateTaskStatus(worker.queue, task.id, WorkerStatus.ERROR, response.statusMessage),
      };
      await workerRepository.patch(worker.id, {
        status: worker.status,
        statusMessage: worker.statusMessage,
        queue: worker.queue,
      });
    }
  }
};

const useJobRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { getWorkersByStatus } = useWorkerContext();

  const workersPosted = getWorkersByStatus(WorkerStatus.POSTED);
  console.log('workersPosted in useJobRealtime:', workersPosted);

  const workersPostedRef = useRef(workersPosted);
  useEffect(() => {
    workersPostedRef.current = workersPosted;
  }, [workersPosted]);

  useEffect(() => {
    if (channelRef.current !== null) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel('job-updates');

    const processJobRows = async (jobs: JobRow[], worker: Worker) => {
      console.log('processJobRows :', jobs);
      let hasError = false;
      for (const job of jobs) {
        const task = worker.queue.find((t) => t.id === job.task_id);
        if (task === undefined) {
          console.error('Task not found for worker_id:', worker.id, 'task_id:', job.task_id);
          continue;
        }
        hasError = hasError || job.status === 'failed';
        if (!hasError) {
          const plugin = workerPlugins[job.worker_name];
          if (plugin.processResult) {
            const response = await plugin.processResult(job.result, task);
            console.log('Processed worker result response:', response);
            if (response.status === WorkerStatus.ERROR) {
              hasError = true;
            }
          }
        }
        worker = {
          ...worker,
          queue: updateTaskStatus(
            worker.queue,
            task.id,
            job.status === 'failed' ? WorkerStatus.ERROR : WorkerStatus.COMPLETED,
            job.status === 'failed' ? JSON.stringify(job.error) : '',
          ),
        };
      }

      const workerRepository = getWorkerRepository();

      if (hasError) {
        const updatedWorker = {
          ...worker,
          status: WorkerStatus.ERROR,
        };
        await workerRepository.patch(updatedWorker.id, {
          status: updatedWorker.status,
          statusMessage: updatedWorker.statusMessage,
        });
      } else {
        const updatedWorker = {
          ...worker,
          status: WorkerStatus.COMPLETED,
        };
        console.log('Saving worker ', updatedWorker);

        await workerRepository.patch(updatedWorker.id, {
          status: updatedWorker.status,
        });
      }
    };

    const handleJobRowUpdate = async (payload: RealtimePostgresUpdatePayload<JobRow>) => {
      const job = payload.new;
      console.log('Change received!', job);
      const workerRepository = getWorkerRepository();
      const worker_id = job.worker_id;
      try {
        const worker = await workerRepository.getById(worker_id);

        const task = worker.queue.find((t) => t.id === job.task_id);
        if (task === undefined) {
          console.error('Task not found for worker_id:', worker_id, 'task_id:', job.task_id);
          return;
        }

        switch (job.status) {
          case 'failed':
            break;
          case 'completed':
            await processResult(worker, task, job.result);
            break;
          default:
            console.error('Unknown job status:', job.status);
            return;
        }
      } catch (error) {
        console.error('Error processing worker result:', error);
      }
    };

    channel.on<JobRow>(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'cs_jobs' },
      (payload) => void handleJobRowUpdate(payload),
    );

    void channel.subscribe((status) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        console.log('Subscribed to job updates');
      }
    });

    channelRef.current = channel;

    const interval = setInterval(() => {
      const fetchJobUpdates = async () => {
        for (const worker of workersPostedRef.current) {
          const { data, error } = await supabase
            .from('cs_jobs')
            .select('*')
            .eq('worker_id', worker.id);
          console.log('fetchJobUpdates ', worker.id);
          if (error) {
            console.error('Error fetching job updates:', error);
          } else {
            await processJobRows(data, worker);
          }
        }
      };
      void fetchJobUpdates();
    }, 10000);

    return () => {
      clearInterval(interval);

      if (channelRef.current !== null) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
};

export default useJobRealtime;
