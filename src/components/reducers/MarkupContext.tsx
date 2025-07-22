import { Annotation, getAnnotationText } from '@/data/models/Annotation';
import { DataField, DataModel } from '@/data/models/DataModel';
import { NamedEntity } from '@/data/models/NamedEntity';
import { useAppSelector } from '@/hooks/hooks';
import { getEntities } from '@/state/selectors/namedEntity';
import { IRect } from 'konva/lib/types';
import { createContext, useContext, useEffect, useReducer } from 'react';

export const MARKUP_ACTIONS = {
  SET_RECT: 'SET_RECT',
  SET_SELECTED: 'SET_SELECTED',
  SET_FIELD_TO_SELECTED: 'SET_FIELD_TO_SELECTED',
  SET_TEXT: 'SET_TEXT',
  SET_MODEL: 'SET_MODEL',
} as const;

export type MarkupAction =
  | { type: typeof MARKUP_ACTIONS.SET_RECT; payload: { index: number; rect: IRect } }
  | { type: typeof MARKUP_ACTIONS.SET_SELECTED; payload: number }
  | { type: typeof MARKUP_ACTIONS.SET_FIELD_TO_SELECTED; payload: DataField | undefined }
  | {
      type: typeof MARKUP_ACTIONS.SET_TEXT;
      payload: { annotations: Annotation[]; entities: NamedEntity[] };
    }
  | { type: typeof MARKUP_ACTIONS.SET_MODEL; payload: DataModel | undefined };

export type WordRect = {
  line: number;
  rect: IRect;
  dataFieldId?: string;
  word: string;
  annotationId: string;
  annotationWordIndex: number; // index of the word in the annotation
};

type MarkupState = {
  text: Annotation[];
  wordRects: WordRect[];
  selected: number[];
  stage: {
    width: number;
    height: number;
  };
  model: DataModel | undefined;
};

const computeRects = (index: number, rect: IRect, wordRects: WordRect[]) => {
  const updatedRects = [...wordRects];
  // Update the rect of the current word
  if (index > 0) {
    if (updatedRects[index].line === updatedRects[index - 1].line) {
      updatedRects[index].rect = {
        ...rect,
        x: updatedRects[index - 1].rect.x + updatedRects[index - 1].rect.width,
        y: updatedRects[index - 1].rect.y,
      };
    } else {
      updatedRects[index].rect = {
        ...rect,
        x: 2,
        y: updatedRects[index - 1].rect.y + updatedRects[index - 1].rect.height + 3, //+3 = margin between lines
      };
    }
  } else {
    updatedRects[index].rect = rect;
  }
  // Update the rects of the words after the current one
  if (index + 1 < updatedRects.length) {
    for (let i = index + 1; i < updatedRects.length; i++) {
      if (updatedRects[i - 1].line === updatedRects[i].line) {
        updatedRects[i].rect = {
          ...updatedRects[i].rect,
          x: updatedRects[i - 1].rect.x + updatedRects[i - 1].rect.width,
          y: updatedRects[i - 1].rect.y,
        };
      } else {
        updatedRects[i].rect = {
          ...updatedRects[i].rect,
          x: 0,
          y: updatedRects[i - 1].rect.y + updatedRects[i - 1].rect.height,
        };
      }
    }
  }

  return updatedRects;
};

const buildWordRects = (annotations: Annotation[], entities: NamedEntity[]) => {
  let rects: WordRect[] = [];
  for (let indexLine = 0; indexLine < annotations.length; indexLine++) {
    const annotationId = annotations[indexLine].id;
    const line = getAnnotationText(annotations[indexLine]);
    const words = line.split(' ');
    const lineRects = words.map((word, index) => ({
      line: indexLine,
      rect: { x: 0, y: 0, width: 0, height: 0 },
      word,
      annotationId,
      annotationWordIndex: index,
      dataFieldId: entities.find((e) =>
        e.selector.some((sel) => sel.annotationId === annotationId && sel.indexes.includes(index)),
      )?.dataFieldId,
    }));
    rects = rects.concat(lineRects);
  }
  return rects;
};

const initState = (
  annotations: Annotation[],
  entities: NamedEntity[],
  model?: DataModel,
): MarkupState => {
  return {
    text: annotations,
    wordRects: buildWordRects(annotations, entities),
    selected: [],
    stage: {
      width: 2000,
      height: 2000,
    },
    model: model,
  };
};

const reducer = (state: MarkupState, action: MarkupAction) => {
  switch (action.type) {
    case MARKUP_ACTIONS.SET_MODEL: {
      return {
        ...state,
        model: action.payload,
      };
    }
    case MARKUP_ACTIONS.SET_TEXT: {
      const { annotations, entities } = action.payload;
      return {
        ...state,
        text: annotations,
        wordRects: buildWordRects(annotations, entities),
      };
    }
    case MARKUP_ACTIONS.SET_RECT: {
      const { index, rect } = action.payload;
      const rects = computeRects(index, rect, state.wordRects);
      const maxWidth = Math.max(...rects.map((r) => r.rect.x + r.rect.width));
      const maxHeight = Math.max(...rects.map((r) => r.rect.y + r.rect.height));

      return {
        ...state,
        wordRects: rects,
        stage: {
          width: maxWidth,
          height: maxHeight,
        },
      };
    }
    case MARKUP_ACTIONS.SET_SELECTED: {
      const index = action.payload;
      const isSelected = state.selected.includes(index);
      return {
        ...state,
        selected: isSelected
          ? state.selected.filter((i) => i !== index)
          : [...state.selected, index],
      };
    }
    case MARKUP_ACTIONS.SET_FIELD_TO_SELECTED: {
      const field = action.payload;
      return {
        ...state,
        wordRects: state.wordRects.map((wordRect, index) => {
          if (state.selected.includes(index)) {
            return {
              ...wordRect,
              dataFieldId: field !== undefined ? field.id : undefined,
            };
          }
          return wordRect;
        }),
        selected: [],
      };
    }
    default:
      return state;
  }
};

type MarkupContextType = {
  state: MarkupState;
  dispatch: React.Dispatch<MarkupAction>;
};

const MarkupContext = createContext<MarkupContextType | undefined>(undefined);

export const MarkupProvider = ({
  children,
  text,
  model,
}: {
  children: React.ReactNode;
  text: Annotation[];
  model?: DataModel;
}) => {
  const entities = useAppSelector(getEntities);
  const [state, dispatch] = useReducer(reducer, initState(text, entities, model));

  useEffect(() => {
    dispatch({ type: MARKUP_ACTIONS.SET_TEXT, payload: { annotations: text, entities } });
  }, [text]);

  useEffect(() => {
    dispatch({ type: MARKUP_ACTIONS.SET_MODEL, payload: model });
  }, [model?.id]);

  return <MarkupContext.Provider value={{ state, dispatch }}>{children}</MarkupContext.Provider>;
};

export const useMarkupContext = () => {
  const context = useContext(MarkupContext);
  if (!context) {
    throw new Error('useMarkupContext must be used within a MarkupProvider');
  }
  return context;
};
