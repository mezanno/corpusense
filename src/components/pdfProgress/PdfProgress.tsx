import { useSyncExternalStore } from 'react';
import { Progress } from '../ui/progress';
import progressStore from './progressStore';

const PdfProgress = () => {
  const value = useSyncExternalStore(progressStore.subscribe, progressStore.get);

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>{value.toFixed(2)}%</p>
      <Progress value={value} />
    </div>
  );
};

export default PdfProgress;
