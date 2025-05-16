import Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Label, Tag, Text } from 'react-konva';
import { MARKUP_ACTIONS, useMarkupContext } from './reducers/MarkupContext';

type WordLabelProps = {
  word: string;
  index: number;
};

//#86A69D (vert)
//#F2B263 (orange)
//#F2E8DF (light)
//#F2C6C2  (rose)
//#F28585 (red)

const WordLabel = ({ word, index }: WordLabelProps) => {
  const { state, dispatch } = useMarkupContext();
  const labelRef = useRef<Konva.Label>(null);
  const [isHovered, setIsHovered] = useState(false);

  const computedX = state.wordRects[index].rect.x;
  const computedY = state.wordRects[index].rect.y;
  const isSelected = state.selected.includes(index);

  //send to the context the rect of the label
  useEffect(() => {
    if (labelRef.current) {
      const label = labelRef.current;
      dispatch({ type: MARKUP_ACTIONS.SET_RECT, payload: { index, rect: label.getClientRect() } });
    }
  }, []);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    //if the right button is clicked, do nothing
    if (e.evt.button === 2) {
      return;
    }
    dispatch({ type: MARKUP_ACTIONS.SET_SELECTED, payload: index });
  };

  const handleMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
    if (event.evt.buttons === 1) {
      dispatch({ type: MARKUP_ACTIONS.SET_SELECTED, payload: index });
    }
    setIsHovered(true);
  };

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
      <Tag fill={isSelected ? '#F2B263' : ''} />
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
