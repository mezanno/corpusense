import ModelViewer from '@/components/ModelViewer';
import QuickCanvasViewer from '@/components/QuickCanvasViewer';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
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
import useDialog from '@/hooks/ui/useDialog';
import { exportModelRequest, removeModelRequest } from '@/state/reducers/models';
import { selectModels } from '@/state/selectors/models';
import ReactJsonView from '@microlink/react-json-view';
import { Download, EyeIcon, Grid2X2Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModelsManagerPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const models = useAppSelector(selectModels);
  const { openDialog } = useAlertDialogContext();
  const { openImportModelDialog, openCreateModelDialog } = useDialog();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [canvasViewVisible, setCanvasViewVisible] = useState(false);

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
    <div className='flex h-full w-full flex-col'>
      <div className='mb-1 flex justify-between'>
        <div className='flex items-center space-x-2'>
          <button className='soft-button' onClick={openCreateModelDialog}>
            <Grid2X2Plus />
          </button>
          <button className='soft-button' onClick={openImportModelDialog}>
            <Download />
          </button>
        </div>
        <button
          className={`soft-button ${canvasViewVisible ? '' : 'bg-transparent'}`}
          title={t('btn_toggle_canvas_view')}
          aria-label={t('btn_toggle_canvas_view')}
        >
          <EyeIcon onClick={() => setCanvasViewVisible(!canvasViewVisible)} />
        </button>
      </div>
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        <ResizablePanel order={1} id='metadata-panel' className='flex flex-col' minSize={50}>
          <div className='panel mb-1 max-h-1/3 overflow-auto border'>
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
        </ResizablePanel>
        {canvasViewVisible && (
          <>
            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
            <ResizablePanel id='canvas-panel' order={3} minSize={25} className='panel'>
              <QuickCanvasViewer />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default ModelsManagerPage;
