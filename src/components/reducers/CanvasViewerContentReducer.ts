import { getImage } from '@/data/utils/canvas';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import { TileSource } from 'openseadragon';

export const ACTIONS = {
  TOGGLE_TREE_PANEL: 'TOGGLE_TREE_PANEL',
  TOGGLE_MODE: 'TOGGLE_MODE',
  SET_CANVAS: 'SET_CANVAS',
  SOMETHING_HAS_CHANGED: 'SOMETHING_HAS_CHANGED',
} as const;

export interface CanvasViewerContentState {
  treePanelOpen: boolean;
  mode: string; // 'draw' | 'move'
  error: string | undefined;
  source: TileSource[]; //the source of tiles for the viewer from the canvas
  image: IIIFExternalWebResource | undefined;
  canvas: Canvas | undefined;
  somethingHasChanged: boolean;
}

export const initialState: CanvasViewerContentState = {
  treePanelOpen: false,
  mode: 'move',
  error: undefined,
  source: [],
  image: undefined,
  canvas: undefined,
  somethingHasChanged: false,
};

export type CanvasViewerContentAction =
  | { type: typeof ACTIONS.TOGGLE_TREE_PANEL }
  | { type: typeof ACTIONS.TOGGLE_MODE }
  | { type: typeof ACTIONS.SET_CANVAS; payload: Canvas }
  | { type: typeof ACTIONS.SOMETHING_HAS_CHANGED; payload: boolean };

export function CanvasViewerContentReducer(
  state = initialState,
  action: CanvasViewerContentAction,
) {
  switch (action.type) {
    case ACTIONS.TOGGLE_TREE_PANEL: {
      return {
        ...state,
        treePanelOpen: !state.treePanelOpen,
      };
    }
    case ACTIONS.TOGGLE_MODE: {
      return {
        ...state,
        mode: state.mode === 'draw' ? 'move' : 'draw',
      };
    }
    case ACTIONS.SET_CANVAS: {
      const canvas = action.payload;
      try {
        const image = getImage(canvas);
        console.log('ACTIONS.SET_CANVAS - image: ', image);

        let source = undefined;
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
        console.log('ACTIONS.SET_CANVAS - source: ', source);
        //if source is undefined, set an error
        if (source === undefined) {
          return {
            ...state,
            error: 'Aucun service trouvé',
            somethingHasChanged: false,
          };
        }
        return {
          ...state,
          image,
          canvas,
          source,
          somethingHasChanged: false,
        };
      } catch (error) {
        console.error('ACTIONS.SET_CANVAS - error: ', error);
        return {
          ...state,
          error: getErrorMessage(error),
          somethingHasChanged: false,
        };
      }
    }
    case ACTIONS.SOMETHING_HAS_CHANGED: {
      return {
        ...state,
        somethingHasChanged: action.payload,
      };
    }
    default: {
      throw Error(`Action inconnue`);
    }
  }
}

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
