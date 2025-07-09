import { ElementType } from '@/data/models/Annotation';
import { DataModel } from '@/data/models/DataModel';
import { Worker } from '@/data/models/Worker';
import { useAppDispatch } from '@/hooks/hooks';
import {
  duplicateAnnotationsEach2PagesRequest,
  duplicateAnnotationsToAllPagesRequest,
  removeAllCanvasAnnotationsRequest,
} from '@/state/reducers/annotations';
import { exportTextOfCanvasRequest } from '@/state/reducers/export';
import {
  exportWorkerResultRequest,
  fetchOcrRequest,
  startWorkerProcess,
} from '@/state/reducers/workers';
import { getAnnotationsByType } from '@/state/selectors/annotations';
import { RootState } from '@/state/store';
import { Move, SquarePen } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ReducerContext } from './CanvasViewer';
import { CanvasViewerContentProps } from './CanvasViewerContent';
import LayoutMenu from './menu/LayoutMenu';
import { ACTIONS } from './reducers/CanvasViewerContentReducer';
import SelectModelForm from './textviewer/SelectModelForm';
import Toolbar from './ToolBar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export const withTools = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
  const ComponentWithTools = (props: CanvasViewerContentProps) => {
    const appDispatch = useAppDispatch();
    const { t } = useTranslation();
    const { cvcState, cvcDispatch } = useContext(ReducerContext);
    const [dialogOpen, setDialogOpen] = useState(false);

    const regionAnnotations = useSelector((state: RootState) =>
      getAnnotationsByType(
        state,
        cvcState.canvas?.id ?? '',
        props.collectionId ?? '',
        ElementType.REGION,
      ),
    );

    // const handleStartLayoutAnalysis = () => {
    //   if (
    //     cvcState?.image?.id !== undefined &&
    //     cvcState?.canvas !== undefined &&
    //     props.collectionId !== undefined
    //   ) {
    //     appDispatch(
    //       fetchLayoutRequest({
    //         canvas: cvcState.canvas,
    //         collectionId: props.collectionId,
    //         originalWidth: cvcState.image.width ?? 0,
    //       }),
    //     );
    //   }
    // };

    const handleStartOcrAnalysis = () => {
      if (cvcState?.image?.id !== undefined && props.collectionId !== undefined) {
        appDispatch(fetchOcrRequest({ canvas: props.canvas, collectionId: props.collectionId }));
      }
    };

    const handleExportText = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          exportTextOfCanvasRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleExtractData = () => {
      setDialogOpen(true);
    };

    const handleExportResult = (worker: Worker) => {
      appDispatch(exportWorkerResultRequest({ worker }));
    };

    const handleDeleteAllAnnotations = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          removeAllCanvasAnnotationsRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleDuplicateRegionToAllPages = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          duplicateAnnotationsToAllPagesRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleDuplicateRegionEach2 = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          duplicateAnnotationsEach2PagesRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const close = (model: DataModel) => {
      setDialogOpen(false);

      if (props.collectionId !== undefined) {
        appDispatch(
          startWorkerProcess({
            workerName: 'mistral',
            params: {
              scope: { canvasId: props.canvas.id, collectionId: props.collectionId },
              model,
              workerName: 'mistral',
            },
          }),
        );
      }
    };

    return (
      <div className='flex h-full w-full flex-col'>
        <h4 className='w-full border-b-1 text-center text-sm italic'>{props.canvas?.id}</h4>
        <div className='m-1 flex h-auto w-full gap-2 space-x-2'>
          <Toolbar
            handleOcr={handleStartOcrAnalysis}
            handleExportText={handleExportText}
            handleDeleteAllAnnotations={handleDeleteAllAnnotations}
            // handleLayout={handleStartLayoutAnalysis}
            handleExtractData={handleExtractData}
            handleExportResult={handleExportResult}
            scope={{ canvasId: cvcState.canvas?.id ?? '', collectionId: props.collectionId ?? '' }}
          />

          <div className='flex items-center space-x-1 rounded-xl border p-2 align-middle'>
            <Label className='flex items-center gap-1'>
              <Move size={16} />
              {t('btn_toggle_mode_view')}
            </Label>
            <Switch
              id='viewer-mode'
              onCheckedChange={() => cvcDispatch({ type: ACTIONS.TOGGLE_MODE })}
            />
            <Label className='flex items-center gap-1'>
              {t('btn_toggle_mode_annotate')}
              <SquarePen size={16} />{' '}
            </Label>
          </div>
          {regionAnnotations.length > 0 && (
            <LayoutMenu
              handleDuplicateToAll={handleDuplicateRegionToAllPages}
              handleDuplicateEach2={handleDuplicateRegionEach2}
              scope={{
                canvasId: cvcState.canvas?.id ?? '',
                collectionId: props.collectionId ?? '',
              }}
            />
          )}
        </div>
        <WrappedComponent {...(props as T)} />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('title_generate_data')}</DialogTitle>
              <DialogDescription>{t('description_select_model')}</DialogDescription>
            </DialogHeader>
            <SelectModelForm close={close} />
          </DialogContent>
        </Dialog>
      </div>
    );
  };
  return ComponentWithTools;
};
export default withTools;
