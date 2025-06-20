import { Annotation, getAnnotationText } from '@/data/models/Annotation';
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
} as const;

export type MarkupAction =
  | { type: typeof MARKUP_ACTIONS.SET_RECT; payload: { index: number; rect: IRect } }
  | { type: typeof MARKUP_ACTIONS.SET_SELECTED; payload: number }
  | { type: typeof MARKUP_ACTIONS.SET_FIELD_TO_SELECTED; payload: string }
  | {
      type: typeof MARKUP_ACTIONS.SET_TEXT;
      payload: { annotations: Annotation[]; entities: NamedEntity[] };
    };

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
};

const computeRects = (index: number, rect: IRect, wordRects: WordRect[]) => {
  // Update the rect of the current word
  if (index > 0) {
    if (wordRects[index].line === wordRects[index - 1].line) {
      wordRects[index].rect = {
        ...rect,
        x: wordRects[index - 1].rect.x + wordRects[index - 1].rect.width,
        y: wordRects[index - 1].rect.y,
      };
    } else {
      wordRects[index].rect = {
        ...rect,
        x: 0,
        y: wordRects[index - 1].rect.y + wordRects[index - 1].rect.height,
      };
    }
  } else {
    wordRects[index].rect = rect;
  }
  // Update the rects of the words after the current one
  if (index + 1 < wordRects.length) {
    for (let i = index + 1; i < wordRects.length; i++) {
      if (wordRects[i - 1].line === wordRects[i].line) {
        wordRects[i].rect = {
          ...wordRects[i].rect,
          x: wordRects[i - 1].rect.x + wordRects[i - 1].rect.width,
          y: wordRects[i - 1].rect.y,
        };
      } else {
        wordRects[i].rect = {
          ...wordRects[i].rect,
          x: 0,
          y: wordRects[i - 1].rect.y + wordRects[i - 1].rect.height,
        };
      }
    }
  }

  return wordRects;
};

// console.log('Word Rect:', wordRect);

const initState = (annotations: Annotation[], entities: NamedEntity[]) => {
  let rects: WordRect[] = [];
  for (let indexLine = 0; indexLine < annotations.length; indexLine++) {
    const annotationId = annotations[indexLine].id;
    const line = getAnnotationText(annotations[indexLine]);
    const words = line.split(' ');
    // const dataFieldId =
    // console.log('Entity for word:', dataFieldId);
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
  return {
    text: annotations,
    wordRects: rects,
    selected: [],
    stage: {
      width: 2000,
      height: 2000,
    },
  };
};

const reducer = (state: MarkupState, action: MarkupAction) => {
  switch (action.type) {
    case MARKUP_ACTIONS.SET_TEXT: {
      return initState(action.payload.annotations, action.payload.entities);
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
              dataFieldId: field,
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
}: {
  children: React.ReactNode;
  text: Annotation[];
}) => {
  const entities = useAppSelector(getEntities);
  const [state, dispatch] = useReducer(reducer, initState(text, entities));
  useEffect(() => {
    dispatch({ type: MARKUP_ACTIONS.SET_TEXT, payload: { annotations: text, entities } });
  }, [text]);

  return <MarkupContext.Provider value={{ state, dispatch }}>{children}</MarkupContext.Provider>;
};

export const useMarkupContext = () => {
  const context = useContext(MarkupContext);
  if (!context) {
    throw new Error('useMarkupContext must be used within a MarkupProvider');
  }
  return context;
};
