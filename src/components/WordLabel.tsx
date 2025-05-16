import Konva from 'konva';
import { useEffect, useRef } from 'react';
import { Label, Tag, Text } from 'react-konva';
import { MARKUP_ACTIONS, useMarkupContext } from './reducers/MarkupContext';

type WordLabelProps = {
  word: string;
  index: number;
};

const WordLabel = ({ word, index }: WordLabelProps) => {
  const { state, dispatch } = useMarkupContext();
  const labelRef = useRef<Konva.Label>(null);

  const computedX = state.wordRects[index].rect.x;
  const computedY = state.wordRects[index].rect.y;

  //send to the context the rect of the label
  useEffect(() => {
    if (labelRef.current) {
      const label = labelRef.current;
      dispatch({ type: MARKUP_ACTIONS.SET_RECT, payload: { index, rect: label.getClientRect() } });
    }
  }, []);

  return (
    <Label x={computedX} y={computedY} ref={labelRef}>
      <Tag fill='black' />
      <Text text={word} fontSize={24} fill='white' padding={5} fontFamily='Calibri' />
    </Label>
  );
};

export default WordLabel;
