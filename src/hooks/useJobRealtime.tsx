import { workerPlugins } from '@/App';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { WorkerStatus } from '@/data/models/Worker';
import { supabase } from '@/utils/config';
import {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

const useJobRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { getWorkersByStatus, getTaskById } = useWorkerContext();

  const workersPosted = getWorkersByStatus(WorkerStatus.POSTED);
  console.log('workersPosted in useJobRealtime:', workersPosted);

  useEffect(() => {
    if (channelRef.current !== null) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel('job-updates');

    const handleJobUpdate = async (
      payload: RealtimePostgresChangesPayload<{
        [key: string]: unknown;
      }>,
    ) => {
      //TODO : typeguard
      console.log('Change received!', payload);
      if (
        payload.eventType === 'UPDATE' &&
        payload.new !== null &&
        'status' in payload.new &&
        payload.new.status === 'completed' &&
        'result' in payload.new &&
        'worker_name' in payload.new &&
        typeof payload.new.worker_name === 'string' &&
        'worker_id' in payload.new &&
        typeof payload.new.worker_id === 'string' &&
        'task_id' in payload.new &&
        typeof payload.new.task_id === 'number'
      ) {
        console.log('Change received!', payload.new.result);
        try {
          const plugin = workerPlugins[payload.new.worker_name];
          if (plugin.processResult) {
            const worker_id = payload.new.worker_id;
            const task = getTaskById(worker_id, payload.new.task_id);
            if (task === undefined) {
              console.error(
                'Task not found for worker_id:',
                worker_id,
                'task_id:',
                payload.new.task_id,
              );
              return;
            }
            await plugin.processResult(payload.new, task);
          }
        } catch (error) {
          console.error('Error processing worker result:', error);
        }
      }
    };

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cs_jobs' },
      (payload) => void handleJobUpdate(payload),
    );

    void channel.subscribe((status) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        console.log('Subscribed to job updates');
      }
    });

    channelRef.current = channel;

    const interval = setInterval(() => {
      //   const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();

      //   if (data) setJob(data as Job);
      console.log('fallback polling');
    }, 5000);

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
