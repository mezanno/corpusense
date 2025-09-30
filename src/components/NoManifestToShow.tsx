import { useAppSelector } from '@/hooks/hooks';
import { selectHistory } from '@/state/selectors/manifests';
import { useTranslation } from 'react-i18next';
import HistoryNav from './HistoryNav';
import NothingToShow from './NothingToShow';
import Welcome from './Welcome';

const NoManifestToShow = () => {
  const history = useAppSelector(selectHistory);
  const { t } = useTranslation();

  return (
    <div className='text-mezanno-4 m-2 flex h-full w-full max-w-[800px] flex-col justify-center p-2'>
      {history.length > 0 ? (
        <>
          <NothingToShow />

          <div className='h-1/2 overflow-auto'>
            <h4 className='mt-10'>{t('title_recently_opened')}</h4>
            <HistoryNav />
          </div>
        </>
      ) : (
        <Welcome />
      )}
    </div>
  );
};

export default NoManifestToShow;
