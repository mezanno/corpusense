import { useModels } from '@/hooks/data/models/useModels';
import { Group, Line, Rect } from 'react-konva';
import { useMarkupContext } from '../reducers/MarkupContext';

const WordLabelBackground = ({
  x,
  y,
  width,
  height,
  index,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}) => {
  const { state } = useMarkupContext();
  const isSelected = state.selected.includes(index);
  const dataFieldId = state.wordRects[index].dataFieldId;
  const dataField = useModels().getDatafieldById(dataFieldId ?? '');

  //compute which border to show
  const showTop = dataField !== null;
  const showBottom = dataField !== null;
  const showLeft =
    state.wordRects[index - 1] === undefined ||
    (dataFieldId !== undefined && state.wordRects[index - 1]?.dataFieldId !== dataFieldId);
  const showRight =
    (dataFieldId !== undefined &&
      state.wordRects[index + 1]?.dataFieldId !== dataFieldId &&
      state.wordRects[index + 1]?.line === state.wordRects[index].line) ||
    (dataFieldId !== undefined &&
      state.wordRects[index + 1]?.dataFieldId !== dataFieldId &&
      state.wordRects[index + 1]?.line !== state.wordRects[index].line);

  const color = dataField !== null ? dataField.color : '';
  const borderColor = 'black';
  const borderWidth = 1;

  const lines = [];
  if (showTop) {
    lines.push(
      <Line
        key='top'
        points={[x, y, x + width, y]}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />,
    );
  }
  if (showRight) {
    lines.push(
      <Line
        key='right'
        points={[x + width, y, x + width, y + height]}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />,
    );
  }

  if (showBottom) {
    lines.push(
      <Line
        key='bottom'
        points={[x, y + height, x + width, y + height]}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />,
    );
  }

  if (showLeft) {
    lines.push(
      <Line
        key='left'
        points={[x, y, x, y + height]}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />,
    );
  }

  if (isSelected) {
    lines.push(
      <Line
        key='selected_bottom'
        points={[x, y + height + 2, x + width, y + height + 2]}
        stroke='red'
        strokeWidth={2}
        dash={[5, 5]}
      />,
      <Line
        key='selected_top'
        points={[x, y - 2, x + width, y - 2]}
        stroke='red'
        strokeWidth={2}
        dash={[5, 5]}
      />,
    );
  }

  return (
    <Group>
      <Rect x={x} y={y} width={width} height={height} fill={color} />
      {lines}
    </Group>
  );
};

export default WordLabelBackground;
