import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WorkerDurationCounterProps {
  estimatedDuration: number;
}

const WorkerDurationCounter = ({ estimatedDuration }: WorkerDurationCounterProps) => {
  const { t } = useTranslation();
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const remainingDuration = Math.max(0, estimatedDuration - (now - startedAt));

  return (
    <span className='text-sm'>
      ({t('info_worker_remaining_time', { time: Math.ceil(remainingDuration / 1000) })})
    </span>
  );
};

export default WorkerDurationCounter;
