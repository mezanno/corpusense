import ExpertReportCard from '@/components/features/expert/ExpertReportCard';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useModels } from '@/hooks/data/models/useModels';
import useModifierChainLive from '@/hooks/data/modifiers/useModifierChainLive';
import useLiveSources from '@/hooks/data/sources/useLiveSources';
import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { Container, Globe, HardDrive, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExpertPage = () => {
  const { t } = useTranslation();
  const { sourcesCount } = useLiveSources();
  const { collectionCount } = useCollections();
  const { modelCount } = useModels();
  const { modifierCount } = useModifierChainLive();

  return (
    <div className='flex w-full flex-col gap-2'>
      <ExpertReportCard
        value={sourcesCount.local}
        label={t('info_report_local_sources')}
        route={`/${CorpusenseRoutes.LOCAL_SOURCES}`}
        icon={<HardDrive className='text-primary' size={28} />}
      />

      <ExpertReportCard
        value={sourcesCount.remote}
        label={t('info_report_online_sources')}
        route={`/${CorpusenseRoutes.IIIF_SOURCES}`}
        icon={<Globe className='text-primary' size={28} />}
      />

      <ExpertReportCard
        value={collectionCount}
        label={t('info_report_collections')}
        route={`/${CorpusenseRoutes.COLLECTIONS}`}
        icon={<List className='text-primary' size={28} />}
      />

      <ExpertReportCard
        value={modelCount}
        label={t('info_report_models')}
        route={`/${CorpusenseRoutes.MODELS}`}
        icon={<Container className='text-primary' size={28} />}
      />

      <ExpertReportCard
        value={modifierCount}
        label={t('info_report_modifiers')}
        route={`/${CorpusenseRoutes.MODIFIERCHAIN}`}
        icon={<Container className='text-primary' size={28} />}
      />
    </div>
  );
};

export default ExpertPage;
