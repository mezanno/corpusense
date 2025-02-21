import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import { setSelection } from '@/state/reducers/selection';
import { Canvas } from '@iiif/presentation-3';
import { FC, useEffect, useRef, useState } from 'react';
import Selecto, { OnSelect } from 'react-selecto';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';
import CanvasCard from './CanvasCard';
import CanvasesListViewer from './CanvasesListViewer';

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

const CanvasesViewer: FC = () => {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useAppSelector((state) => state.manifests);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [image, setImage] = useState(null);
  const [mode, setMode] = useState('grid');

  const containerRef = useRef(null);

  useEffect(() => {
    if (data) {
      setCanvases(data.items);
    }
  }, [data]);

  const handleCardClick = (canvas: Canvas) => {
    //TODO! Vérifications à faire
    if (canvas.items?.[0]?.items?.[0]?.body != null) {
      console.log(canvas.items[0].items[0].body);

      // setImage(canvas.items[0].items[0].body);
      dispatch(
        setCanvasFromComponent({ componentId: 'test', canvas: canvas.items[0].items[0].body }),
      );
    }
  };

  const handleSelect = (e: OnSelect) => {
    dispatch(
      setSelection(
        e.selected.map((el) => ({ index: el.dataset.index, canvas: canvases[el.dataset.index] })),
      ),
    );
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
              <CanvasesListViewer
                height={height}
                width={width}
                size={4}
                layout='vertical'
                canvases={canvases}
                handleCardClick={handleCardClick}
              />
            )
          }
        </AutoSizer>
      ) : (
        <div>Rien</div>
      )}
    </div>
  );
};

export default CanvasesViewer;

/*
  openSeadragonConfig={{
    loadTilesWithAjax: false,
  }}
  si true, charge les images avec XHR ce qui empêche de mettre en cache, il faut donc mettre false pour utiliser fetch
*/
