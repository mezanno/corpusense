import { useAppSelector } from '@/hooks/hooks';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { selectCanvases, selectManifestURL } from '@/state/selectors/manifests';
import { Canvas } from '@iiif/presentation-3';
import { FC, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    manifestId: string;
    width: number;
    height: number;
    colCount: number;
    canvasToDisplay: Canvas | undefined;
    setCanvasToDisplay: (canvas: Canvas) => void;
  };
}

const GridCell: FC<GridCellProps> = ({ columnIndex, rowIndex, style, data }) => {
  const index = rowIndex * data.colCount + columnIndex;
  //we return an empty div if the index is out of bounds
  //this is to avoid the error "index out of bounds" when using react-window
  if (index >= data.canvases.length) {
    return <div style={style} />;
  }

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
      <CanvasCard
        canvas={canvas}
        index={index}
        manifestId={data.manifestId}
        thumbWidth={data.width}
        thumbHeight={data.height}
        setCanvasToDisplay={data.setCanvasToDisplay}
        canvasToDisplay={data.canvasToDisplay}
      />
    </div>
  );
};

const CanvasGallery = ({
  canvasToDisplay,
  setCanvasToDisplay,
}: {
  canvasToDisplay: Canvas | undefined;
  setCanvasToDisplay: (canvas: Canvas) => void;
}) => {
  const { t } = useTranslation();
  const canvases = useAppSelector(selectCanvases);
  const manifestId = useAppSelector(selectManifestURL);
  const { setSelection, getSelectionCount } = useCanvasSelection();

  const [colCount, setColCount] = useState(5);

  const containerRef = useRef(null);

  const handleSelect = (e: OnSelect) => {
    setSelection(e.selected.map((el) => el.dataset.index).map(Number));
  };

  const handleOnResize = (size: { height: number; width: number }) => {
    setColCount(Math.max(2, Math.floor(size.width / 150)));
  };

  const selectionCount = getSelectionCount();

  return (
    <section className='h-full w-full items-center justify-center p-4' aria-label='canvas gallery'>
      {canvases.length == 0 ? (
        <div role='alert'>{t('info_empty_manifest')}</div>
      ) : (
        <div className='relative h-full w-full overflow-hidden'>
          <Selecto
            container={containerRef.current}
            selectableTargets={['.selectable-item']}
            selectByClick={false}
            selectFromInside={true}
            toggleContinueSelect={['shift']}
            hitRate={0}
            onSelect={handleSelect}
          />
          <AutoSizer ref={containerRef} role='list' onResize={handleOnResize}>
            {({ height, width }) => (
              <Grid
                columnCount={colCount}
                columnWidth={width / colCount}
                height={height}
                rowCount={Math.ceil(canvases.length / colCount)}
                rowHeight={175}
                width={width}
                itemData={{
                  canvases,
                  manifestId,
                  canvasToDisplay,
                  setCanvasToDisplay,
                  width: width / colCount - 20,
                  height: 165,
                  colCount: colCount,
                }}
              >
                {GridCell}
              </Grid>
            )}
          </AutoSizer>
          {selectionCount > 0 && (
            <div className='absolute flex w-full justify-center'>
              <div className='mt-2 rounded-xl border bg-white/85 px-2 font-bold italic'>
                {t('info_selection_count', { count: selectionCount })}
              </div>
            </div>
          )}
        </div>
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
