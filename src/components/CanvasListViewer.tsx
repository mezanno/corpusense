import { Canvas } from '@iiif/presentation-3';
import { FC } from 'react';
import { FixedSizeList as List } from 'react-window';
import CanvasCard from './CanvasCard';

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    canvases: Canvas[];
    handleCardClick: (canvas: Canvas) => void;
  };
}

const Row: FC<RowProps> = ({ index, style, data }) => {
  const canvas = data.canvases[index];
  return (
    <div style={style}>
      <CanvasCard canvas={canvas} onClick={data.handleCardClick} index={index} />
    </div>
  );
};

const CanvasListViewer = ({
  width,
  height,
  size,
  layout,
  canvases,
  handleCardClick,
}: {
  width: number;
  height: number;
  size: number;
  layout: 'horizontal' | 'vertical';
  canvases: Canvas[];
  handleCardClick: (canvas: Canvas) => void;
}) => {
  return (
    <List
      height={height}
      width={width}
      layout={layout}
      itemSize={layout === 'horizontal' ? width / size : height / size}
      itemCount={canvases.length}
      itemData={{ canvases, handleCardClick }}
    >
      {Row}
    </List>
  );
};

export default CanvasListViewer;
