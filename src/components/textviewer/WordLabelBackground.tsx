import { Group, Line, Rect } from 'react-konva';

const WordLabelBackground = ({
  x,
  y,
  width,
  height,
  showTop,
  showRight,
  showBottom,
  showLeft,
  color,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  showTop: boolean;
  showRight: boolean;
  showBottom: boolean;
  showLeft: boolean;
  color: string;
}) => {
  const borderColor = 'black';
  const borderWidth = 2;

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

  return (
    <Group>
      <Rect x={x} y={y} width={width} height={height} fill={color} />
      {lines}
    </Group>
  );
};

export default WordLabelBackground;
