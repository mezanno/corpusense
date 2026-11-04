import { Card, CardContent } from '@/components/ui/card';
import { Project } from '@/data/models/project';
import useProjectsIO from '@/hooks/data/projects/useProjectsIO';
import useDialog from '@/hooks/ui/useDialog';
import { Plus } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SourceSectionProps = {
  selectedProjectId: string | undefined;
};

const SourceSection = ({ selectedProjectId }: SourceSectionProps) => {
  const { t } = useTranslation();
  const { getProjectById, addSourceToProject } = useProjectsIO();
  const { openOpenManifestDialog } = useDialog();
  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);

  const onProjectId = useEffectEvent(() => {
    async function loadProject() {
      if (selectedProjectId !== undefined) {
        const projectResult = await getProjectById(selectedProjectId);
        if (projectResult.ok) {
          setCurrentProject(projectResult.value);
        }
      } else {
        setCurrentProject(undefined);
      }
    }
    void loadProject();
  });

  useEffect(() => {
    if (selectedProjectId !== undefined) {
      onProjectId();
    }
  }, [selectedProjectId]);

  const handleOnAddRemoteSource = () => {
    openOpenManifestDialog({
      onResult: (sourceAddedId) => {
        void addSourceToProject(currentProject!.id, sourceAddedId);
      },
    });
  };

  return (
    <div
      className={`flex h-full w-full rounded-lg ${currentProject === undefined ? 'bg-white/50' : 'bg-white'} shadow`}
    >
      <span className='flex h-full items-center pl-5 text-9xl font-black'>2</span>

      <div className='flex h-full w-full flex-col items-center justify-evenly gap-2'>
        <h2 className='w-full text-center text-2xl'>{t('title_add_sources_to_project')}</h2>
        <div className='m-4 flex w-3/4 gap-2'>
          {currentProject === undefined ? (
            <span className='text-xl italic'>{t('error_no_project_selected')}</span>
          ) : (
            <>
              <div className='flex flex-col gap-2'>
                <Card
                  className='card-model h-28 w-24 border-dashed'
                  onClick={handleOnAddRemoteSource}
                >
                  <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
                    <Plus size={24} />
                    <span className='text-center'>{t('btn_add_online_source')}</span>
                  </CardContent>
                </Card>
                <Card
                  className='card-model h-28 w-24 border-dashed'
                  //   onClick={() => openCreateProjectDialog(onProjectCreated)}
                >
                  <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
                    <Plus size={24} />
                    <span className='text-center'>{t('btn_add_local_source')}</span>
                  </CardContent>
                </Card>
              </div>
              {currentProject?.sources.length !== 0 ? (
                <div className='grid w-full grid-cols-4 grid-rows-2 gap-4 rounded-2xl border-2 border-dashed p-2'>
                  {currentProject?.sources.map((sourceId) => (
                    <div key={sourceId}>Source {sourceId}</div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed'>
                  <span className='text-xl text-secondary italic'>
                    {t('no_sources_in_project')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceSection;
