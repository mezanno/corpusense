import { useAppSelector } from '@/hooks/hooks';
import { getHistory } from '@/state/selectors/manifests';
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
  const history = useAppSelector(getHistory);

  return (
    <div className='m-2 w-full max-w-[600px] p-2 text-mezanno-4'>
      <NothingToShow />
      {history.length > 0 && (
        <>
          <h4 className='mt-10'>Récemment ouverts :</h4>
          <HistoryNav />
        </>
      )}
    </div>
  );
};

export { NoManifestToShow, NothingToShow };
