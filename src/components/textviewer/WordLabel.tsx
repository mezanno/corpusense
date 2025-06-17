import { useAppSelector } from '@/hooks/hooks';
import { getDatafieldById, hasActiveModel } from '@/state/selectors/models';
import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Label, Tag, Text } from 'react-konva';
import { MARKUP_ACTIONS, useMarkupContext } from '../reducers/MarkupContext';

type WordLabelProps = {
  word: string;
  index: number;
};

const WordLabel = ({ word, index }: WordLabelProps) => {
  const { state, dispatch } = useMarkupContext();
  const labelRef = useRef<Konva.Label>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hasModel = useAppSelector(hasActiveModel);

  const computedX = state.wordRects[index].rect.x;
  const computedY = state.wordRects[index].rect.y;
  const isSelected = state.selected.includes(index);

  const dataFieldId = state.wordRects[index].dataFieldId;
  console.log('dataFieldId ', dataFieldId);
  const dataField = useAppSelector((s) =>
    dataFieldId !== undefined ? getDatafieldById(s, dataFieldId) : null,
  );

  useEffect(() => {
    /*
     * We need to use setTimeout and requestAnimationFrame due to a display bug with StrictMode + Konva.
     * Delay the rect calculation to ensure Konva has completed layout.
     * setTimeout waits for the current call stack to clear,
     * then requestAnimationFrame ensures the DOM is ready before measuring.
     */
    let raf: number;
    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(() => {
        if (labelRef.current) {
          dispatch({
            type: MARKUP_ACTIONS.SET_RECT,
            payload: { index, rect: labelRef.current.getClientRect() },
          });
        }
      });
    }, 30);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    //if the right button is clicked, do nothing
    if (!hasModel || e.evt.button === 2) {
      return;
    }
    dispatch({ type: MARKUP_ACTIONS.SET_SELECTED, payload: index });
  };

  const handleMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
    if (!hasModel) {
      return;
    }
    if (event.evt.buttons === 1) {
      dispatch({ type: MARKUP_ACTIONS.SET_SELECTED, payload: index });
    }
    setIsHovered(true);
  };

  const tagColor = dataField !== null ? dataField.color : isSelected ? '#F2B263' : '';

  return (
    <Label
      x={computedX}
      y={computedY}
      ref={labelRef}
      id={'' + index}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      <Tag fill={tagColor} />
      <Text
        text={word}
        fontSize={20}
        fill='black'
        // fill='white'
        padding={5}
        fontFamily='Calibri'
        textDecoration={isHovered ? 'underline' : ''}
      />
    </Label>
  );
};

export default WordLabel;
