import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useOcr } from '@/hooks/useOcr';
import { syncWithDB } from '@/state/reducers/annotations';
import { startProcess } from '@/state/reducers/workers';
import { getAnnotations } from '@/state/selectors/annotations';
import { isWorkerRunning } from '@/state/selectors/workers';
import { RootState } from '@/state/store';
import { Move, Network, Save, SquarePen, TextSearch } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ReducerContext } from './CanvasViewer';
import { CanvasViewerContentProps } from './CanvasViewerContent';
import { ACTIONS } from './reducers/CanvasViewerContentReducer';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { Spinner } from './ui/spinner';
import { Switch } from './ui/switch';
import { Toggle } from './ui/toggle';

export const withTools = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
  const ComponentWithTools = (props: CanvasViewerContentProps) => {
    console.log('withTools - render');

    //Tesseract worker states
    const { progress, working } = useOcr();

    const appDispatch = useAppDispatch();
    const { t } = useTranslation();
    const { cvcState, cvcDispatch } = useContext(ReducerContext);

    const isRunning = useAppSelector((state: RootState) =>
      cvcState?.image?.id !== undefined ? isWorkerRunning(state, cvcState.image.id) : false,
    );

    /** 
     on va surveiller les annotations dans le store pour voir si on doit mettre le statut de sauvegarde à jour
     */
    const annotationsInStore = useSelector((state: RootState) =>
      getAnnotations(state, props.canvas.id),
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

    const handleOcrClick = () => {
      console.log('click ', cvcState);

      if (cvcState?.image?.id !== undefined) {
        appDispatch(
          startProcess({
            imageUrl: cvcState.image.id,
            canvasId: props.canvas.id,
            originalWidth: cvcState.image.width ?? 0,
          }),
        );
        setIsLookingForLayout(true);
      }
    };

    const handleSave = () => {
      appDispatch(syncWithDB(props.canvas.id));
      cvcDispatch({ type: ACTIONS.SOMETHING_HAS_CHANGED, payload: false });
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
          <Toggle
            pressed={cvcState?.treePanelOpen}
            onPressedChange={() => cvcDispatch({ type: ACTIONS.TOGGLE_TREE_PANEL })}
            aria-label='Toggle annotation tree panel'
          >
            <Network />
          </Toggle>
          {!isRunning ? (
            <Button onClick={handleOcrClick}>
              <TextSearch />
              {t('btn_detect_layout')}
            </Button>
          ) : (
            <div className='flex items-center space-x-2 text-sm'>
              <Spinner />
              {t('info_layout')}
            </div>
          )}
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
            {working && (
              <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
                <Progress value={progress} className='w-[60%]' />
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
