import ListMetadaForm from '@/components/ListMetadaForm';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { getActiveList } from '@/state/selectors/lists';
import { getCanvasById } from '@/state/selectors/storedItems';
import { IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { createRef, useEffect, useRef } from 'react';

const GridThumb = ({ canvasId }: { canvasId: string }) => {
  const canvas = useAppSelector(getCanvasById(canvasId));

  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  return (
    <Thumbnail
      thumbnail={thumbnail}
      style={{ width: '100px', height: '100px', objectFit: 'contain' }}
      className='w-fit'
    />
  );
};

const ListInspectorPage = () => {
  const dispatch = useAppDispatch();
  const activeList = useAppSelector(getActiveList);
  const gridRef = useRef(null);
  const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement | null> }>({});

  if (activeList?.content) {
    if (Object.keys(refs.current).length !== activeList.content.length) {
      activeList.content.forEach(({ canvasId }) => {
        if (!(canvasId in refs.current)) {
          refs.current[canvasId] = createRef();
        }
      });
    }
  }

  useEffect(() => {
    if (activeList?.content && gridRef.current !== null) {
      const grid = GridStack.init({ float: false, disableResize: true }, gridRef.current);
      grid.on('change', (event, items) => {
        grid.compact();
      });
      grid.batchUpdate(); //afin d'éviter les rendus tant qu'on n'a pas terminé les makeWidgets
      grid.removeAll();
      activeList.content.forEach(({ canvasId }) => {
        const item = refs.current[canvasId].current;
        if (item !== null) {
          grid.makeWidget(item);
        }
      });
      grid.batchUpdate(false); //on termine les makeWidgets
    }
  }, [activeList]);

  return (
    <div className='flex-col space-y-2'>
      {activeList && (
        <>
          <h1>List Inspector</h1>
          <div className='rounded-md border bg-white'>
            <ListMetadaForm list={activeList} />
          </div>
          <div>
            {activeList?.content ? (
              <div ref={gridRef} className='grid-stack flex h-max rounded-md border bg-white'>
                {activeList.content.map((item) => (
                  <div
                    key={item.canvasId}
                    ref={refs.current[item.canvasId]}
                    className='grid-stack-item'
                  >
                    <div className='grid-stack-item-content flex items-center justify-center'>
                      <GridThumb canvasId={item.canvasId} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>Aucun élément dans la liste</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ListInspectorPage;
