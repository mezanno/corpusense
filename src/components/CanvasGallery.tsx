import { useAppSelector } from '@/hooks/hooks';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { selectCanvases, selectManifestURL } from '@/state/selectors/manifests';
import { Canvas } from '@iiif/presentation-3';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Selecto, { OnSelect } from 'react-selecto';
import AutoSizer from 'react-virtualized-auto-sizer';
import CanvasCard from './CanvasCard';

const CanvasGallery = ({
  canvasToDisplay,
  setCanvasToDisplay,
}: {
  canvasToDisplay: Canvas | null;
  setCanvasToDisplay: (canvas: Canvas | null) => void;
}) => {
  const { t } = useTranslation();
  const canvases = useAppSelector(selectCanvases);
  const manifestId = useAppSelector(selectManifestURL);
  const { setSelection, getSelectionCount } = useCanvasSelection();

  const [colCount, setColCount] = useState(5);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // calcule les lignes en fonction des colonnes
  const rowCount = Math.ceil(canvases.length / colCount);

  /** Virtualizer vertical (pour les lignes) */
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    gap: 10,
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 165 + 10, // hauteur de ligne
    overscan: 2,
  });

  /** Virtualizer horizontal (pour les colonnes) */
  const colVirtualizer = useVirtualizer({
    gap: 10,
    horizontal: true,
    count: colCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 100, // largeur (sera mise à jour dynamiquement)
    overscan: 2,
  });

  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(-1);

  useEffect(() => {
    setCurrentCanvasIndex(
      canvasToDisplay ? canvases.findIndex((c) => c.id === canvasToDisplay.id) : -1,
    );
  }, [canvasToDisplay]);

  /** Navigation manuelle vers un index donné */
  const scrollToCanvas = (index: number) => {
    const targetRow = Math.floor(index / colCount);
    rowVirtualizer.scrollToIndex(targetRow, { align: 'center' });
  };

  const handleSelect = (e: OnSelect) => {
    setSelection(e.selected.map((el) => el.dataset.index).map(Number));
  };

  const handleCanvasIndexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const index = parseInt(v, 10) - 1;
    if (!isNaN(index) && index >= 0 && index < canvases.length) {
      setCanvasToDisplay(canvases[index]);
      scrollToCanvas(index);
    } else if (v === '') {
      setCanvasToDisplay(null);
    }
  };

  const selectionCount = getSelectionCount();

  return (
    <section className='center h-full w-full p-4' aria-label='canvas gallery'>
      {canvases.length == 0 ? (
        <div role='alert'>{t('info_empty_manifest')}</div>
      ) : (
        <>
          <div className='m-2 flex items-center justify-end gap-2 text-sm text-gray-600 italic'>
            <input
              className='w-20'
              type='number'
              min={1}
              max={canvases.length}
              value={currentCanvasIndex < 0 ? '' : currentCanvasIndex + 1}
              onChange={handleCanvasIndexChange}
            />
            /<span>{canvases.length}</span>
          </div>
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
            <AutoSizer
              onResize={(size) => {
                setColCount(Math.max(2, Math.floor(size.width / 115)));
              }}
            >
              {({ width, height }) => {
                return (
                  <div
                    ref={containerRef}
                    style={{
                      width,
                      height,
                      overflow: 'auto',
                      position: 'relative',
                    }}
                  >
                    <div
                      className='m-2'
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: `${colVirtualizer.getTotalSize()}px`,
                        position: 'relative',
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                        <Fragment key={virtualRow.key}>
                          {colVirtualizer.getVirtualItems().map((virtualColumn) => {
                            const index = virtualRow.index * colCount + virtualColumn.index;
                            if (index >= canvases.length) return null;

                            const canvas = canvases[index];
                            return (
                              <div
                                key={`${virtualRow.key}-${virtualColumn.key}`}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: `${virtualColumn.size}px`,
                                  height: `${virtualRow.size}px`,
                                  transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                                }}
                              >
                                <CanvasCard
                                  canvas={canvas}
                                  index={index}
                                  manifestId={manifestId}
                                  thumbWidth={virtualColumn.size}
                                  thumbHeight={virtualRow.size}
                                  setCanvasToDisplay={setCanvasToDisplay}
                                  canvasToDisplay={canvasToDisplay}
                                />
                              </div>
                            );
                          })}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                );
              }}
            </AutoSizer>
            {selectionCount > 0 && (
              <div className='absolute flex w-full justify-center'>
                <div className='mt-2 rounded-xl border bg-white/85 px-2 font-bold italic'>
                  {t('info_selection_count', { count: selectionCount })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default CanvasGallery;
