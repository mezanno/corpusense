import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { syncWithDB } from '@/state/reducers/annotations';
import { exportTextOfCanvasRequest } from '@/state/reducers/export';
import { fetchLayoutRequest, fetchOcrRequest, WorkerStatus } from '@/state/reducers/workers';
import { getAnnotations } from '@/state/selectors/annotations';
import { getWorker } from '@/state/selectors/workers';
import { RootState } from '@/state/store';
import { Move, Save, SquarePen } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import AnalysisMenu from './AnalysisMenu';
import { ReducerContext } from './CanvasViewer';
import { CanvasViewerContentProps } from './CanvasViewerContent';
import ExportMenu from './ExportMenu';
import { ACTIONS } from './reducers/CanvasViewerContentReducer';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { Switch } from './ui/switch';

export const withTools = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
  const ComponentWithTools = (props: CanvasViewerContentProps) => {
    const appDispatch = useAppDispatch();
    const { t } = useTranslation();
    const { cvcState, cvcDispatch } = useContext(ReducerContext);

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

    const handleSave = () => {
      if (props.collectionId !== undefined) {
        appDispatch(syncWithDB({ canvasId: props.canvas.id, collectionId: props.collectionId }));
        cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: false });
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

    // const flow = useMemo(
    //   () => (
    //     <ReactFlowProvider>
    //       <AnnotationsFlow canvasId={props.canvas?.id} selectedNodeId={selected[0]?.annotation?.id} />
    //     </ReactFlowProvider>
    //   ),
    //   [props.canvas, selected],
    // );

    return (
      <div className='flex h-full w-full flex-col'>
        <h4 className='w-full border-b-1 text-center text-sm italic'>{props.canvas?.id}</h4>

        <div className='m-1 flex h-auto w-full gap-2 space-x-2'>
          {/* <Toggle
            className='soft-button'
            pressed={cvcState?.treePanelOpen}
            onPressedChange={() => cvcDispatch({ type: ACTIONS.TOGGLE_TREE_PANEL })}
            aria-label='Toggle annotation tree panel'
          >
            <Network />
          </Toggle> */}
          <AnalysisMenu
            isRunning={isWorkerRunning}
            handleLayout={handleStartLayoutAnalysis}
            handleOcr={handleStartOcrAnalysis}
          />

          <ExportMenu handleExportText={handleExportText} isRunning={false} />

          <div className='flex items-center space-x-1 align-middle'>
            <span className='ml-1'>
              {cvcState?.mode === 'draw' ? <SquarePen size={16} /> : <Move size={16} />}
            </span>
            <Switch
              id='viewer-mode'
              onCheckedChange={() => cvcDispatch({ type: ACTIONS.TOGGLE_MODE })}
            />
            <Label htmlFor='viewer-mode' className='flex items-center'>
              <span>
                {cvcState?.mode === 'draw'
                  ? t('btn_toggle_mode_view')
                  : t('btn_toggle_mode_annotate')}
              </span>
            </Label>
          </div>
          {cvcState.somethingHasChanged && (
            <Button onClick={handleSave}>
              <Save />
              Something Has Changed!
            </Button>
          )}
        </div>

        <ResizablePanelGroup direction='horizontal' className='flex w-full grow space-x-2'>
          {/* {cvcState?.treePanelOpen === true && (
          <>
            <ResizablePanel className='h-full w-1/2'>
              <HoverContext.Provider value={{ hoveredElement }}>
                <HoverSetterContext.Provider value={{ setHoveredElement }}>
                  {flow}
                </HoverSetterContext.Provider>
              </HoverContext.Provider>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )} */}
          <ResizablePanel className='relative h-full w-1/2'>
            <WrappedComponent {...(props as T)} />
            {isWorkerRunning && (
              <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
                {/* <Progress value={progress} className='w-[60%]' /> */}
                **
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  };
  return ComponentWithTools;
};
export default withTools;
