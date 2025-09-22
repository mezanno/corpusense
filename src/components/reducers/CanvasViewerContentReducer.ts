import { getImage } from '@/data/utils/canvas';
import { getErrorMessage } from '@/utils/utils';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import { TileSource } from 'openseadragon';

export const ACTIONS = {
  SET_MODE: 'SET_MODE',
  SET_CANVAS: 'SET_CANVAS',
  TOGGLE_ANNOTATIONS: 'TOGGLE_ANNOTATIONS',
} as const;

export enum CanvasViewerContentMode {
  DRAW = 'draw',
  MOVE = 'move',
}
export interface CanvasViewerContentState {
  mode: CanvasViewerContentMode;
  error: string | undefined;
  source: TileSource[]; //the source of tiles for the viewer from the canvas
  image: IIIFExternalWebResource | undefined;
  canvas: Canvas | undefined;
  showAnnotations: boolean;
}

export const initialState: CanvasViewerContentState = {
  mode: CanvasViewerContentMode.MOVE,
  error: undefined,
  source: [],
  image: undefined,
  canvas: undefined,
  showAnnotations: true,
};

export type CanvasViewerContentAction =
  | { type: typeof ACTIONS.SET_MODE; payload: CanvasViewerContentMode }
  | { type: typeof ACTIONS.SET_CANVAS; payload: Canvas }
  | { type: typeof ACTIONS.TOGGLE_ANNOTATIONS };

export function CanvasViewerContentReducer(
  state = initialState,
  action: CanvasViewerContentAction,
) {
  switch (action.type) {
    case ACTIONS.SET_MODE: {
      return {
        ...state,
        mode: action.payload,
      };
    }
    case ACTIONS.TOGGLE_ANNOTATIONS: {
      return {
        ...state,
        showAnnotations: !state.showAnnotations,
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
          };
        }
        return {
          ...state,
          image,
          canvas,
          source,
        };
      } catch (error) {
        console.error('ACTIONS.SET_CANVAS - error: ', error);
        return {
          ...state,
          error: getErrorMessage(error),
        };
      }
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
