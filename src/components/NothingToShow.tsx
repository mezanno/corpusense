import { useAppSelector } from '@/hooks/hooks';
import { getHistory } from '@/state/selectors/manifests';
import { CircleSlash2 } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import HistoryNav from './HistoryNav';

const NothingToShow = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className='flex w-full flex-col items-center space-y-2 text-mezanno-4'>
      <CircleSlash2 size={64} />
      <div role='alert' className='text-2xl'>
        {t('error_nothing_toshow')}
      </div>
      {children}
    </div>
  );
};

const NoManifestToShow = () => {
  const history = useAppSelector(getHistory);
  const { t } = useTranslation();

  return (
    <div className='m-2 w-full max-w-[600px] p-2 text-mezanno-4'>
      <NothingToShow />
      {history.length > 0 && (
        <>
          <h4 className='mt-10'>{t('title_recently_opened')}</h4>
          <HistoryNav />
        </>
      )}
    </div>
  );
};

export { NoManifestToShow, NothingToShow };
