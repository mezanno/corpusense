import { getImage } from '@/data/utils/canvas';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import { TileSource } from 'openseadragon';
import { createContext, useCallback, useEffect, useReducer } from 'react';

export enum CanvasViewerMode {
  DRAW = 'draw',
  MOVE = 'move',
}

export interface CanvasViewerState {
  mode: CanvasViewerMode;
  error: string | undefined;
  source: TileSource[]; //the source of tiles for the viewer from the canvas
  image: IIIFExternalWebResource | undefined;
  canvas: Canvas;
  showAnnotations: boolean;
  hoveredElement: string | null; //the id of the annotation currently hovered
}
const initialValues = {
  mode: CanvasViewerMode.MOVE,
  error: undefined,
  source: [] as TileSource[],
  image: undefined,
  showAnnotations: true,
  hoveredElement: null,
};

const initState = (canvas: Canvas): CanvasViewerState => {
  try {
    const image = getImage(canvas);
    let source: TileSource[] = [];
    if (image?.service?.length != null) {
      const service = image.service[0] as ImageService;
      if (service !== undefined) {
        const id = service['@id'] ?? service.id;
        if (id !== undefined) {
          const newSource = [`${id}/info.json`] as unknown as TileSource[];
          source = newSource;
        }
      }
    }
    //if source is undefined, set an error
    if (!source.length) {
      return {
        ...initialValues,
        canvas,
        error: 'Aucun service trouvé',
      };
    }
    return {
      ...initialValues,
      image,
      canvas,
      source,
    };
  } catch (error) {
    return {
      ...initialValues,
      canvas,
      error: getErrorMessage(error),
    };
  }
};

export const ACTIONS = {
  SET_MODE: 'SET_MODE',
  TOGGLE_ANNOTATIONS: 'TOGGLE_ANNOTATIONS',
  SET_HOVERED: 'SET_HOVERED',
  SET_CANVAS: 'SET_CANVAS',
  SET_SOURCE_AS_IMAGE: 'SET_SOURCE_AS_IMAGE',
} as const;

export type CanvasViewerAction =
  | { type: typeof ACTIONS.SET_MODE; payload: CanvasViewerMode }
  | { type: typeof ACTIONS.TOGGLE_ANNOTATIONS }
  | { type: typeof ACTIONS.SET_HOVERED; payload: string | null }
  | { type: typeof ACTIONS.SET_CANVAS; payload: Canvas }
  | { type: typeof ACTIONS.SET_SOURCE_AS_IMAGE };

function CanvasViewerReducer(state: CanvasViewerState, action: CanvasViewerAction) {
  switch (action.type) {
    case ACTIONS.SET_MODE: {
      return {
        ...state,
        mode: action.payload,
      };
    }
    case ACTIONS.SET_CANVAS: {
      return initState(action.payload);
    }
    case ACTIONS.SET_SOURCE_AS_IMAGE: {
      if (!state.image) {
        return state;
      }
      console.log('Try to use cache for image ', state.image.id);

      return {
        ...state,
        error: 'Tiles failed',
        source: [{ type: 'image', url: state.image.id }] as unknown as TileSource[],
      };
    }
    case ACTIONS.TOGGLE_ANNOTATIONS: {
      return {
        ...state,
        showAnnotations: !state.showAnnotations,
      };
    }
    case ACTIONS.SET_HOVERED: {
      return {
        ...state,
        hoveredElement: action.payload,
      };
    }
    default: {
      throw Error(`Action inconnue`);
    }
  }
}

type CanvasViewerContextType = CanvasViewerState & {
  setMode: (mode: CanvasViewerMode) => void;
  toggleAnnotations: () => void;
  setHovered: (id: string | null) => void;
  setSourceAsImage: () => void;
};

export const CanvasViewerContext = createContext<CanvasViewerContextType | undefined>(undefined);

export const CanvasViewerProvider = ({
  children,
  canvas,
}: {
  children: React.ReactNode;
  canvas: Canvas;
}) => {
  const [state, dispatch] = useReducer(CanvasViewerReducer, canvas, initState);

  useEffect(() => {
    if (canvas !== undefined && canvas.id !== state.canvas.id) {
      dispatch({ type: ACTIONS.SET_CANVAS, payload: canvas });
    }
  }, [canvas, state.canvas]);

  const setMode = useCallback(
    (mode: CanvasViewerMode) => dispatch({ type: ACTIONS.SET_MODE, payload: mode }),
    [dispatch],
  );
  const toggleAnnotations = useCallback(
    () => dispatch({ type: ACTIONS.TOGGLE_ANNOTATIONS }),
    [dispatch],
  );

  const setHovered = useCallback(
    (id: string | null) => dispatch({ type: ACTIONS.SET_HOVERED, payload: id }),
    [dispatch],
  );
  const setSourceAsImage = useCallback(
    () => dispatch({ type: ACTIONS.SET_SOURCE_AS_IMAGE }),
    [dispatch],
  );
  return (
    <CanvasViewerContext.Provider
      value={{ ...state, setMode, setHovered, toggleAnnotations, setSourceAsImage }}
    >
      {children}
    </CanvasViewerContext.Provider>
  );
};

// const newSource = [
//   {
//     '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
// '@id': id
//   .replace('https://gallica.bnf.fr/iiif', '/gallica/iiif/image/v3')
//     '@id': id,
//     height: image.height,
//     width: image.width,
//     profile: ['level2'],
//     '@type': 'ImageService3',
//     format: 'image/webp',
//   } as unknown as TileSource,
// ];
