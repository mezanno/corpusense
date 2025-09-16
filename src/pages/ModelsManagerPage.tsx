import ModelViewer from '@/components/ModelViewer';
import CreateModelButton from '@/components/textviewer/CreateModelButton';
import ImportModelButton from '@/components/textviewer/ImportModelButton';
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
import { exportModelRequest, removeModelRequest } from '@/state/reducers/models';
import { selectModels } from '@/state/selectors/models';
import ReactJsonView from '@microlink/react-json-view';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModelsManagerPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const models = useAppSelector(selectModels);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleRemoveModel = (modelId: string) => {
    appDispatch(removeModelRequest(modelId));
    if (selectedModelId === modelId) {
      setSelectedModelId(null);
    }
  };

  const handleDownloadModel = (modelId: string) => {
    appDispatch(exportModelRequest(modelId));
  };

  return (
    <div>
      <div className='panel mb-1 flex items-center space-x-2'>
        <CreateModelButton />
        <ImportModelButton />
      </div>

      <div className='panel mb-1'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('form_label_model_name')}</TableHead>
              <TableHead>{t('form_label_model_description')}</TableHead>
              <TableHead>{t('table_col_title_actions')}</TableHead>
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
                  <div className='flex items-center space-x-2'>
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
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDownloadModel(model.id);
                      }}
                      title={t('btn_download_model')}
                      aria-label={t('btn_download_model')}
                    >
                      <Download />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedModelId !== null && <ModelViewer modelId={selectedModelId} />}
    </div>
  );
};

export default ModelsManagerPage;
