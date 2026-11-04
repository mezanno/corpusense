import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Project } from '@/data/models/project';
import useProjects from '@/hooks/data/projects/useProjects';
import useDialog from '@/hooks/ui/useDialog';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ProjectSectionProps = {
  selectedProjectId: string | undefined;
  setSelectedProjectId: (id: string | undefined) => void;
};

const ProjectSection = ({ selectedProjectId, setSelectedProjectId }: ProjectSectionProps) => {
  const { t } = useTranslation();
  const { projects } = useProjects();
  const { openCreateProjectDialog } = useDialog();

  const onProjectCreated = (project: Project) => {
    setSelectedProjectId(project.id);
  };

  return (
    <div className='flex h-full w-full rounded-lg bg-white shadow'>
      <span className='flex h-full items-center pl-5 text-9xl font-black'>1</span>
      <div className='flex flex-1 flex-col pt-2'>
        <div className='flex h-full flex-col items-center justify-evenly gap-2'>
          <h2 className='w-full text-center text-2xl'>
            {t('title_create_or_select_project_to_start')}
          </h2>
          <div className='flex w-1/2 flex-col items-center justify-center gap-4'>
            <Card
              className='card-model h-20 w-[180px] border-dashed'
              onClick={() => openCreateProjectDialog(onProjectCreated)}
            >
              <CardContent className='flex h-full w-full flex-col items-center justify-center text-secondary hover:text-primary'>
                <Plus size={36} />
                <span className='text-center'>{t('btn_create_project')}</span>
              </CardContent>
            </Card>
            <Separator />
            {projects.length > 0 && (
              <Select
                onValueChange={(value) => setSelectedProjectId(value)}
                defaultValue={selectedProjectId}
                value={selectedProjectId}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('select_project_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSection;
