import { DataModel } from '@/data/models/DataModel';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeAllCanvasAnnotationsRequest } from '@/state/reducers/annotations';
import { exportTextOfCanvasRequest } from '@/state/reducers/export';
import {
  fetchDataAnalysisRequest,
  fetchLayoutRequest,
  fetchOcrRequest,
  WorkerStatus,
} from '@/state/reducers/workers';
import { getAnnotations } from '@/state/selectors/annotations';
import { getWorker } from '@/state/selectors/workers';
import { RootState } from '@/state/store';
import { Move, SquarePen } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ReducerContext } from './CanvasViewer';
import { CanvasViewerContentProps } from './CanvasViewerContent';
import { ACTIONS } from './reducers/CanvasViewerContentReducer';
import SelectModelForm from './SelectModelForm';
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

    const worker = useAppSelector((state: RootState) =>
      cvcState?.canvas?.id !== undefined ? getWorker(state, cvcState.canvas.id) : null,
    );
    const isWorkerRunning = worker !== null && worker.status === WorkerStatus.PROCESSING;

    /** 
     on va surveiller les annotations dans le store pour voir si on doit mettre le statut de sauvegarde à jour
     */
    const annotationsInStore = useSelector((state: RootState) =>
      getAnnotations(state, cvcState.canvas?.id ?? '', props.collectionId ?? ''),
    );
    const [isLookingForLayout, setIsLookingForLayout] = useState(false);
    useEffect(() => {
      if (isLookingForLayout) {
        setIsLookingForLayout(false);
        cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: true });
      }
    }, [annotationsInStore]);
    /**
     * Fin bloc de code pour surveiller les annotations
     */

    const handleStartLayoutAnalysis = () => {
      if (
        cvcState?.image?.id !== undefined &&
        cvcState?.canvas !== undefined &&
        props.collectionId !== undefined
      ) {
        appDispatch(
          fetchLayoutRequest({
            canvas: cvcState.canvas,
            collectionId: props.collectionId,
            originalWidth: cvcState.image.width ?? 0,
          }),
        );
        setIsLookingForLayout(true);
      }
    };

    const handleStartOcrAnalysis = () => {
      if (cvcState?.image?.id !== undefined && props.collectionId !== undefined) {
        appDispatch(fetchOcrRequest({ canvas: props.canvas, collectionId: props.collectionId }));
      }
      setIsLookingForLayout(true);
    };

    // const handleSave = () => {
    //   if (props.collectionId !== undefined) {
    //     appDispatch(syncWithDB({ canvasId: props.canvas.id, collectionId: props.collectionId }));
    //     cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: false });
    //   }
    // };

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

    const close = (model: DataModel) => {
      setDialogOpen(false);

      if (props.collectionId !== undefined) {
        appDispatch(
          fetchDataAnalysisRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
            model,
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
            handleLayout={handleStartLayoutAnalysis}
            handleExtractData={handleExtractData}
            isRunning={isWorkerRunning}
          />

          <div className='flex items-center space-x-1 rounded-xl border p-2 align-middle'>
            <Switch
              id='viewer-mode'
              onCheckedChange={() => cvcDispatch({ type: ACTIONS.TOGGLE_MODE })}
            />
            <span className='ml-1'>
              {cvcState?.mode === 'draw' ? <SquarePen size={16} /> : <Move size={16} />}
            </span>
            <Label htmlFor='viewer-mode' className='flex items-center'>
              <span>
                {cvcState?.mode === 'draw'
                  ? t('btn_toggle_mode_annotate')
                  : t('btn_toggle_mode_view')}
              </span>
            </Label>
          </div>
          {/* {cvcState.somethingHasChanged && (
            <Button onClick={handleSave}>
              <Save />
              Something Has Changed!
            </Button>
          )} */}
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
