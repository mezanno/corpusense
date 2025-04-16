import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForComponent } from '@/state/selectors/canvas';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Annotorious, useHover } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import React, { createContext, useEffect, useReducer, useState } from 'react';
import { CanvasViewerContent, CanvasViewerContentWithTools } from './CanvasViewerContent';
import { NothingToShow } from './NothingToShow';
import {
  ACTIONS,
  CanvasViewerContentAction,
  CanvasViewerContentReducer,
  CanvasViewerContentState,
  initialState,
} from './reducers/CanvasViewerContentReducer';

//we create a context to share the hovered annotation between the flow and the viewer
export const HoverContext = createContext<{ hoveredElement: string | null }>({
  hoveredElement: null,
});
export const HoverSetterContext = createContext<{
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>;
}>({ setHoveredElement: () => {} });

export const ReducerContext = createContext<{
  cvcState: CanvasViewerContentState;
  cvcDispatch: React.ActionDispatch<[action: CanvasViewerContentAction]>;
}>({ cvcState: initialState, cvcDispatch: () => {} });

const CanvasViewer = ({ name, editable = false }: { name: string; editable?: boolean }) => {
  console.log('CanvasViewer - render', name);
  //get the canvas to display from redux
  const canvas = useAppSelector(getCanvasForComponent(name)) as Canvas;

  const [_hoveredElement, setHoveredElement] = useState<string | null>(null);
  const hover = useHover();

  const [cvcState, cvcDispatch] = useReducer(CanvasViewerContentReducer, initialState);

  useEffect(() => {
    if (canvas !== undefined) {
      cvcDispatch({ type: ACTIONS.SET_CANVAS, payload: canvas });
    }
  }, [canvas]);

  useEffect(() => {
    setHoveredElement(hover?.id);
  }, [hover]);

  return (
    <section className='flex h-full w-full items-center justify-center' aria-label='canvas viewer'>
      {canvas === undefined ? (
        <NothingToShow />
      ) : (
        <Annotorious>
          <ReducerContext.Provider value={{ cvcState, cvcDispatch }}>
            {editable ? (
              <CanvasViewerContentWithTools canvas={canvas} />
            ) : (
              <CanvasViewerContent canvas={canvas} />
            )}
          </ReducerContext.Provider>
        </Annotorious>
      )}
    </section>
  );
};

export default CanvasViewer;
