import { useManifests } from '@/hooks/data/manifests/useManifests';
import { useTranslation } from 'react-i18next';
import HistoryNav from './HistoryNav';
import NothingToShow from './NothingToShow';
import Welcome from './Welcome';

const NoManifestToShow = () => {
  const { historyDetails } = useManifests();
  const { t } = useTranslation();

  return (
    <div className='text-mezanno-4 m-2 flex h-full w-full max-w-[800px] flex-col justify-center p-2'>
      {historyDetails.length > 0 ? (
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
