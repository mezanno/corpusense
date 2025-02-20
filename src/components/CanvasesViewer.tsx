import { Canvas } from '@iiif/presentation-3';
import CloverImage from '@samvera/clover-iiif/image';
import { FC, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Selecto from 'react-selecto';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid, FixedSizeList as List } from 'react-window';
import { setSelection } from '../state/reducers/selection';
import CanvasCard from './CanvasCard';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    canvases: Canvas[];
    handleCardClick: (canvas: Canvas) => void;
  };
}

const GridCell: FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * 4 + columnIndex;
  const canvas = data.canvases[index];

  return (
    <div
      className={` ${
        columnIndex % 2
          ? rowIndex % 2 === 0
            ? 'GridItemOdd'
            : 'GridItemEven'
          : rowIndex % 2
            ? 'GridItemOdd'
            : 'GridItemEven'
      }`}
      style={style}
    >
      <CanvasCard canvas={canvas} onClick={data.handleCardClick} index={index} />
    </div>
  );
};

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

const CanvasesViewer: FC = () => {
  const { data, error, isLoading } = useSelector((state) => state.manifests);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [image, setImage] = useState(null);
  const [mode, setMode] = useState('grid');

  const [selected, setSelected] = useState([]);

  const containerRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (data) {
      setCanvases(data.items);
      console.log('set canvases');
    }
  }, [data]);

  const handleCardClick = (canvas: Canvas) => {
    //TODO! Vérifications à faire
    if (canvas.items?.[0]?.items?.[0]?.body) {
      setImage(canvas.items[0].items[0].body);
    }
  };

  const handleSelect = (e) => {
    console.log('handleSelect: ', e);

    dispatch(setSelection(e.selected.map((el) => Number(el.dataset.index))));
  };

  return (
    <div className='flex h-full p-4'>
      <Selecto
        container={containerRef.current}
        selectableTargets={['.selectable-item']}
        selectByClick={true}
        selectFromInside={true}
        toggleContinueSelect={['shift']}
        hitRate={0}
        onSelect={handleSelect}
      />
      <ResizablePanelGroup direction='horizontal'>
        <ResizablePanel>
          {canvases && canvases.length > 0 ? (
            <AutoSizer ref={containerRef}>
              {({ height, width }) =>
                mode === 'grid' ? (
                  <Grid
                    columnCount={4}
                    columnWidth={width / 4}
                    height={height}
                    rowCount={Math.ceil(canvases.length / 4)}
                    rowHeight={200}
                    width={width}
                    itemData={{ canvases, handleCardClick }}
                  >
                    {GridCell}
                  </Grid>
                ) : (
                  <List
                    height={height}
                    width={150}
                    itemSize={height / 6}
                    itemCount={canvases.length}
                    itemData={{ canvases, handleCardClick }}
                  >
                    {Row}
                  </List>
                )
              }
            </AutoSizer>
          ) : (
            <div>Rien</div>
          )}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          {/* {image && ( */}
          <div className='h-full w-full bg-amber-200'>
            <CloverImage body={image} isTiledImage={true} />
          </div>
          {/* )} */}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CanvasesViewer;
