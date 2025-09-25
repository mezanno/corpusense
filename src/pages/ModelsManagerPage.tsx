import ModelViewer from '@/components/ModelViewer';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
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
import useCreateModelDialog from '@/hooks/ui/useCreateModelDialog';
import useImportModelDialog from '@/hooks/ui/useImportModelDialog';
import { exportModelRequest, removeModelRequest } from '@/state/reducers/models';
import { selectModels } from '@/state/selectors/models';
import ReactJsonView from '@microlink/react-json-view';
import { Download, Grid2X2Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModelsManagerPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const models = useAppSelector(selectModels);
  const { openDialog } = useAlertDialogContext();
  const { openCreateModelDialog } = useCreateModelDialog();
  const { openImportModelDialog } = useImportModelDialog();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleRemoveModel = (modelId: string) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_model'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => {
          appDispatch(removeModelRequest(modelId));
          if (selectedModelId === modelId) {
            setSelectedModelId(null);
          }
        },
      },
    });
  };

  const handleDownloadModel = (modelId: string) => {
    appDispatch(exportModelRequest(modelId));
  };

  return (
    <div>
      <div className='panel mb-1 flex items-center space-x-2'>
        <button className='soft-button' onClick={openCreateModelDialog}>
          <Grid2X2Plus />
        </button>
        <button className='soft-button' onClick={openImportModelDialog}>
          <Download />
        </button>
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
