import { SelectedCanvas } from '@/data/models/SelectedCanvas';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import { setSelection } from '@/state/reducers/selection';
import { getCanvases } from '@/state/selectors/manifests';
import { Canvas } from '@iiif/presentation-3';
import { FC, useRef, useState } from 'react';
import Selecto, { OnSelect } from 'react-selecto';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';
import CanvasCard from './CanvasCard';

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    canvases: Canvas[];
    handleCardClick: (target: EventTarget, canvas: Canvas) => void;
  };
}

const GridCell: FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * 4 + columnIndex;
  const canvas = data.canvases[index];

  return (
    <div
      className={`${
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

const CanvasGallery = () => {
  const dispatch = useAppDispatch();
  const canvases = useAppSelector(getCanvases);
  const containerRef = useRef(null);
  const [_focused, setFocused] = useState<EventTarget | null>(null);

  const handleCardClick = (target: EventTarget, canvas: Canvas) => {
    setFocused((prev) => {
      if (prev !== null) {
        console.log('prev', prev);
        (prev as HTMLElement).classList.remove('border-red-500');
        (prev as HTMLElement).classList.remove('border-2');
      }
      (target as HTMLElement).classList.add('border-red-500');
      (target as HTMLElement).classList.add('border-2');
      return target;
    });

    //TODO! Vérifications à faire
    if (canvas != null) {
      dispatch(
        setCanvasFromComponent({
          componentId: 'test',
          canvas,
        }),
      );
    }
  };

  const handleSelect = (e: OnSelect) => {
    const selection: SelectedCanvas[] = [];
    let start = Number.MAX_VALUE;
    let end = -1;
    e.selected.forEach((el) => {
      if (el?.dataset?.index !== undefined) {
        selection.push({ index: +el.dataset.index, canvas: canvases[+el.dataset.index] });
        if (+el.dataset.index < start) {
          start = +el.dataset.index;
        }
        if (+el.dataset.index > end) {
          end = +el.dataset.index;
        }
      }
    });
    dispatch(setSelection({ selection, start, end }));
  };

  return (
    <section className='h-full w-full items-center justify-center p-4' aria-label='canvas gallery'>
      {canvases.length == 0 ? (
        <div>Le manifest ne contient aucun canvas</div>
      ) : (
        <>
          <Selecto
            container={containerRef.current}
            selectableTargets={['.selectable-item']}
            selectByClick={false}
            selectFromInside={true}
            toggleContinueSelect={['shift']}
            hitRate={0}
            onSelect={handleSelect}
          />
          <AutoSizer ref={containerRef}>
            {({ height, width }) => (
              <Grid
                columnCount={4}
                columnWidth={width / 4}
                height={height}
                rowCount={Math.ceil(canvases.length / 4)}
                rowHeight={150}
                width={width}
                itemData={{ canvases, handleCardClick }}
              >
                {GridCell}
              </Grid>
            )}
          </AutoSizer>
        </>
      )}
    </section>
  );
};

export default CanvasGallery;

/*
  openSeadragonConfig={{
    loadTilesWithAjax: false,
  }}
  si true, charge les images avec XHR ce qui empêche de mettre en cache, il faut donc mettre false pour utiliser fetch
*/
