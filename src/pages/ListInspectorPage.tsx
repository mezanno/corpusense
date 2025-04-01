import CanvasViewer from '@/components/CanvasViewer';
import ListMetadaForm from '@/components/ListMetadaForm';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setCanvasFromComponent } from '@/state/reducers/canvas';
import { removeElementFromList, setActiveList } from '@/state/reducers/lists';
import { getCanvasById } from '@/state/selectors/storedItems';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { CircleX } from 'lucide-react';
import { createRef, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

const CANVASVIEWER_NAME = 'list-inspector';

const GridThumb = ({
  canvasId,
  listId,
  canvasViewerName,
}: {
  canvasId: string;
  listId: string;
  canvasViewerName: string;
}) => {
  const canvas = useAppSelector((state) => getCanvasById(state, canvasId)) as Canvas;
  const dispatch = useAppDispatch();

  const handleOnClick = () => {
    if (canvas !== undefined) {
      dispatch(setCanvasFromComponent({ componentId: canvasViewerName, canvas }));
    }
  };

  const handleDelete = useCallback(() => {
    console.log('Delete', canvasId);
    dispatch(removeElementFromList({ listId, canvasId }));
  }, [canvasId]);

  if (canvas === undefined) {
    return <div aria-errormessage='Error while loading canvas'>Error while loading canvas</div>;
  }
  const thumbnail = canvas.thumbnail as IIIFExternalWebResource[];

  return (
    <div className='group relative' onClick={handleOnClick}>
      <Thumbnail
        thumbnail={thumbnail}
        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
        className='w-fit'
      />
      <div className='absolute top-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100'>
        <CircleX className='text-red-400 hover:text-red-800' onClick={handleDelete} />
      </div>
    </div>
  );
};

const ListInspectorNoContent = () => {
  return <div>Oups</div>;
};

const ListInspectorContent = ({ listid }: { listid: string }) => {
  const activeList = useAppSelector((state) => state.lists.values.find((elt) => elt.id === listid));

  const gridRef = useRef(null);
  const refs = useRef<{ [key: string]: React.RefObject<HTMLDivElement | null> }>({});

  const { t } = useTranslation();

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
      const grid = GridStack.init(
        { float: false, disableResize: true, disableDrag: true },
        gridRef.current,
      );
      grid.on('change', (_event, _items) => {
        grid.compact();
      });
      console.log('compute grid');

      grid.batchUpdate(); //afin d'éviter les rendus tant qu'on n'a pas terminé les makeWidgets
      grid.removeAll();
      activeList.content.forEach(({ canvasId }, index) => {
        const item = refs.current[canvasId].current;
        const x = index % 12;
        const y = Math.floor(index / 12);
        if (item !== null) {
          item.setAttribute('data-gs-x', x.toString());
          item.setAttribute('data-gs-y', y.toString());
          item.setAttribute('data-gs-width', '1');
          item.setAttribute('data-gs-height', '1');
          grid.makeWidget(item);
        }
      });
      grid.batchUpdate(false); //on termine les makeWidgets
    }
  }, [activeList]);

  return (
    <div className='flex h-full w-full flex-col space-y-2'>
      {activeList && (
        <>
          <h1>{t('page_title_listinspector')}</h1>
          <div className='rounded-md border bg-white'>
            <ListMetadaForm list={activeList} />
          </div>
          {/* {activeList?.content ? (
              <div ref={gridRef} className='grid-stack flex h-max rounded-md border bg-white'>
                {activeList.content.map((item) => (
                  <div
                    key={item.canvasId}
                    ref={refs.current[item.canvasId]}
                    className='grid-stack-item'
                  >
                    <div className='grid-stack-item-content flex items-center justify-center'>
                      <GridThumb canvasId={item.canvasId} listId={activeList.id as string} />
                    </div>
                  </div>
                ))}
              </div> */}
          {activeList?.content ? (
            <ResizablePanelGroup
              direction='horizontal'
              className='h-fit flex-1 space-x-2 rounded-md border bg-white'
            >
              <ResizablePanel className='h-full w-full' minSize={30}>
                <div className='m-2 grid grid-cols-8'>
                  {activeList.content.map((item) => (
                    <div
                      key={item.canvasId}
                      ref={refs.current[item.canvasId]}
                      className='flex items-center justify-center'
                    >
                      <GridThumb
                        canvasId={item.canvasId}
                        listId={activeList.id as string}
                        canvasViewerName={CANVASVIEWER_NAME}
                      />
                    </div>
                  ))}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel className='h-full w-full' minSize={30}>
                <CanvasViewer name={CANVASVIEWER_NAME} editable={true} />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div>{t('info_empty_list')}</div>
          )}
        </>
      )}
    </div>
  );
};

const ListInspectorPage = () => {
  const { listid } = useParams();
  const dispatch = useAppDispatch();

  if (listid !== undefined) {
    dispatch(setActiveList(listid));
  }

  return listid === undefined ? (
    <ListInspectorNoContent />
  ) : (
    <ListInspectorContent listid={listid} />
  );
};

export default ListInspectorPage;
