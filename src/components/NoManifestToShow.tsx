import { useAppSelector } from '@/hooks/hooks';
import { getHistory } from '@/state/selectors/manifests';
import { useTranslation } from 'react-i18next';
import HistoryNav from './HistoryNav';
import NothingToShow from './NothingToShow';

const NoManifestToShow = () => {
  const history = useAppSelector(getHistory);
  const { t } = useTranslation();

  return (
    <div className='m-2 flex w-full max-w-[600px] flex-col justify-center p-2 text-mezanno-4'>
      <NothingToShow />
      {history.length > 0 && (
        <div className='h-1/2 overflow-auto'>
          <h4 className='mt-10'>{t('title_recently_opened')}</h4>
          <HistoryNav />
        </div>
      )}
    </div>
  );
};

export default NoManifestToShow;
