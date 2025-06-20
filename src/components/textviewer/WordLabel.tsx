import { useAppSelector } from '@/hooks/hooks';
import { getDatafieldById, hasActiveModel } from '@/state/selectors/models';
import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Group, Text } from 'react-konva';
import { MARKUP_ACTIONS, useMarkupContext } from '../reducers/MarkupContext';
import WordLabelBackground from './WordLabelBackground';

type WordLabelProps = {
  word: string;
  index: number;
};

const WordLabel = ({ word, index }: WordLabelProps) => {
  const { state, dispatch } = useMarkupContext();
  const groupRef = useRef<Konva.Label>(null);
  const textRef = useRef<Konva.Text>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const hasModel = useAppSelector(hasActiveModel);

  const computedX = state.wordRects[index].rect.x;
  const computedY = state.wordRects[index].rect.y;
  const isSelected = state.selected.includes(index);

  const dataFieldId = state.wordRects[index].dataFieldId;
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
        if (groupRef.current) {
          dispatch({
            type: MARKUP_ACTIONS.SET_RECT,
            payload: { index, rect: groupRef.current.getClientRect() },
          });
        }
      });
    }, 30);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (textRef.current) {
      setSize({
        width: textRef.current.width(),
        height: textRef.current.height(),
      });
    }
  }, [textRef]);

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
    <Group
      x={computedX}
      y={computedY}
      ref={groupRef}
      id={'' + index}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      <WordLabelBackground
        x={0}
        y={0}
        width={size.width}
        height={size.height}
        showTop={true}
        showBottom={true}
        showLeft={true}
        showRight={true}
        color={tagColor}
      />
      <Text
        ref={textRef}
        text={word}
        fontSize={20}
        fill='black'
        padding={5}
        fontFamily='Calibri'
        textDecoration={isHovered ? 'underline' : ''}
      />
    </Group>
  );
};

export default WordLabel;
