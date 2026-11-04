import ProjectSection from '@/components/features/projects/ProjectSection';
import SourceSection from '@/components/features/projects/SourceSection';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ProjectPage = () => {
  const { t } = useTranslation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  return (
    <div className='h-full w-full'>
      <div className='grid h-full w-full grid-cols-2 grid-rows-3 gap-4'>
        <ProjectSection
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
        />
        <SourceSection selectedProjectId={selectedProjectId} />
        <div className='h-full w-full border'>{t('page_title_collection_manager')}</div>
        <div className='h-full w-full border'>{t('page_title_models_manager')}</div>
        <div className='h-full w-full border'>{t('page_title_workers_manager')}</div>
      </div>
    </div>
  );
};

export default ProjectPage;
