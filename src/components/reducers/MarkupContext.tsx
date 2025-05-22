import { Annotation, getAnnotationText } from '@/data/models/Annotation';
import { DataField } from '@/data/models/DataModel';
import { IRect } from 'konva/lib/types';
import { createContext, useContext, useReducer } from 'react';

export const MARKUP_ACTIONS = {
  SET_RECT: 'SET_RECT',
  SET_SELECTED: 'SET_SELECTED',
  SET_FIELD_TO_SELECTED: 'SET_FIELD_TO_SELECTED',
  SET_TEXT: 'SET_TEXT',
} as const;

export type MarkupAction =
  | { type: typeof MARKUP_ACTIONS.SET_RECT; payload: { index: number; rect: IRect } }
  | { type: typeof MARKUP_ACTIONS.SET_SELECTED; payload: number }
  | { type: typeof MARKUP_ACTIONS.SET_FIELD_TO_SELECTED; payload: DataField }
  | { type: typeof MARKUP_ACTIONS.SET_TEXT; payload: Annotation[] };

type WordRect = {
  line: number;
  rect: IRect;
  field?: DataField;
  word: string;
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

const init = (text: Annotation[]) => {
  let rects: WordRect[] = [];
  for (let indexLine = 0; indexLine < text.length; indexLine++) {
    const line = getAnnotationText(text[indexLine]);
    const words = line.split(' ');
    const lineRects = words.map((word) => ({
      line: indexLine,
      rect: { x: 0, y: 0, width: 0, height: 0 },
      word,
    }));
    rects = rects.concat(lineRects);
  }
  return {
    text,
    wordRects: rects,
    selected: [],
    stage: {
      width: 0,
      height: 0,
    },
  };
};

const reducer = (state: MarkupState, action: MarkupAction) => {
  switch (action.type) {
    case MARKUP_ACTIONS.SET_TEXT: {
      console.log('SET_TEXT ', action.payload);

      return init(action.payload);
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
              field,
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

export const MarkupProvider = ({ children }: { children: React.ReactNode }) => {
  const initialState = {
    text: [],
    wordRects: [],
    selected: [],
    stage: {
      width: 0,
      height: 0,
    },
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return <MarkupContext.Provider value={{ state, dispatch }}>{children}</MarkupContext.Provider>;
};

export const useMarkupContext = () => {
  const context = useContext(MarkupContext);
  if (!context) {
    throw new Error('useMarkupContext must be used within a MarkupProvider');
  }
  return context;
};
