import { CircleSlash2 } from 'lucide-react';
import { ReactNode } from 'react';
import HistoryNav from './HistoryNav';

const NothingToShow = ({ children }: { children?: ReactNode }) => {
  return (
    <div className='flex w-full flex-col items-center space-y-2 text-mezanno-4'>
      <CircleSlash2 size={64} />
      <div role='alert' className='text-2xl'>
        Nothing to show
      </div>
      {children}
    </div>
  );
};

const NoManifestToShow = () => {
  return (
    <div className='m-2 w-full max-w-[600px] p-2 text-mezanno-4'>
      <NothingToShow />
      <h4 className='mt-10'>Récemment ouverts :</h4>
      <HistoryNav />
    </div>
  );
};

export { NoManifestToShow, NothingToShow };
