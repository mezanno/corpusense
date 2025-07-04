import ModelViewer from '@/components/ModelViewer';
import CreateModelButton from '@/components/textviewer/CreateModelButton';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateSchema } from '@/data/utils/model';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeModelRequest, setActiveModel } from '@/state/reducers/models';
import { getModels } from '@/state/selectors/models';
import ReactJsonView from '@microlink/react-json-view';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ModelsManagerPage = () => {
  const { t } = useTranslation();
  const models = useAppSelector(getModels);
  const appDispatch = useAppDispatch();

  const handleSelectModel = (modelId: string) => {
    appDispatch(setActiveModel(modelId));
  };

  const handleRemoveModel = (modelId: string) => {
    appDispatch(removeModelRequest(modelId));
  };

  return (
    <div>
      <div className='panel mb-1'>
        <CreateModelButton />
      </div>

      <div className='panel mb-1'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du modèle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} onClick={() => handleSelectModel(model.id)}>
                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger>{model.name}</HoverCardTrigger>
                    <HoverCardContent className='w-[500px]'>
                      <ReactJsonView
                        src={JSON.parse(generateSchema(model)) as object}
                        collapsed={2}
                        enableClipboard={false}
                      />
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell>{model.description}</TableCell>
                <TableCell className='space-x-2 align-middle'>
                  <Button
                    variant='destructive'
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveModel(model.id);
                    }}
                    title={t('btn_delete')}
                    aria-label={t('btn_delete')}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ModelViewer />
    </div>
  );
};

export default ModelsManagerPage;
