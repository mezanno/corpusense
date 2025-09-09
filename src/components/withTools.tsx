import { Annotation, ElementType } from '@/data/models/Annotation';
import { Worker } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  duplicateAnnotationsEach2PagesRequest,
  duplicateAnnotationsToAllPagesRequest,
  removeAnnotationsByIdsRequest,
  removeAnnotationsByScopeRequest,
} from '@/state/reducers/annotations';
import { exportTextOfCanvasRequest } from '@/state/reducers/export';
import { exportWorkerResultRequest } from '@/state/reducers/workers';
import { selectAnnotationsByType } from '@/state/selectors/annotations';
import { selectIsWorkerOrTaskRunning } from '@/state/selectors/workers';
import { RootState } from '@/state/store';
import { useSelection } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { NotebookPen } from 'lucide-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import AnnotationForm from './AnnotationForm';
import { ReducerContext } from './CanvasViewer';
import LayoutMenu from './menu/LayoutMenu';
import { ACTIONS, CanvasViewerContentMode } from './reducers/CanvasViewerContentReducer';
import Toolbar from './ToolBar';
import { Toggle } from './ui/toggle';

export const withTools = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
  const ComponentWithTools = (props: { collectionId: string; canvas: Canvas }) => {
    const appDispatch = useAppDispatch();
    const { t } = useTranslation();
    const { cvcState, cvcDispatch } = useContext(ReducerContext);
    const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
    const isWorkerRunning = useAppSelector((state) =>
      selectIsWorkerOrTaskRunning(state, { collectionId: props.collectionId }),
    );

    const regionAnnotations = useSelector((state: RootState) =>
      selectAnnotationsByType(state, ElementType.REGION),
    );

    const handleExportText = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          exportTextOfCanvasRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleExportResult = (worker: Worker) => {
      appDispatch(exportWorkerResultRequest({ worker }));
    };

    const handleDeleteAllAnnotations = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          removeAnnotationsByScopeRequest({
            scope: {
              canvasId: props.canvas.id,
              collectionId: props.collectionId,
            },
          }),
        );
      }
    };

    const handleDuplicateRegionToAllPages = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          duplicateAnnotationsToAllPagesRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleDuplicateRegionEach2 = () => {
      if (props.collectionId !== undefined) {
        appDispatch(
          duplicateAnnotationsEach2PagesRequest({
            canvasId: props.canvas.id,
            collectionId: props.collectionId,
          }),
        );
      }
    };

    const handleAddAnnotation = () => {
      if (cvcState.mode === CanvasViewerContentMode.DRAW) {
        cvcDispatch({ type: ACTIONS.SET_MODE, payload: CanvasViewerContentMode.MOVE });
      } else {
        cvcDispatch({ type: ACTIONS.SET_MODE, payload: CanvasViewerContentMode.DRAW });
      }
    };

    const handleDeleteAnnotation = () => {
      const ids = selected.map((s) => s.annotation.id);
      appDispatch(removeAnnotationsByIdsRequest(ids)); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Delete' && selected?.length > 0) {
        handleDeleteAnnotation();
      }
    };

    return (
      <div className='flex h-full w-full flex-col' onKeyDown={handleKeyDown}>
        <h4 className='w-full border-b-1 text-center text-sm italic'>{props.canvas?.id}</h4>
        {isWorkerRunning ? (
          <div>
            <strong>{t('info_worker_running')}</strong>
          </div>
        ) : (
          <div className='m-1 flex h-auto w-full gap-2 space-x-2'>
            <Toolbar
              handleExportText={handleExportText}
              handleDeleteAllAnnotations={handleDeleteAllAnnotations}
              handleExportResult={handleExportResult}
              scope={{
                canvasId: cvcState.canvas?.id ?? '',
                collectionId: props.collectionId ?? '',
              }}
            />
            <Toggle
              className='soft-button'
              size={null}
              title={t('btn_add_annotation')}
              onClick={handleAddAnnotation}
              pressed={cvcState.mode === CanvasViewerContentMode.DRAW}
            >
              <NotebookPen size={24} />
            </Toggle>
            {regionAnnotations.length > 0 && (
              <LayoutMenu
                handleDuplicateToAll={handleDuplicateRegionToAllPages}
                handleDuplicateEach2={handleDuplicateRegionEach2}
                scope={{
                  canvasId: cvcState.canvas?.id ?? '',
                  collectionId: props.collectionId ?? '',
                }}
              />
            )}
          </div>
        )}
        <div className='flex h-full w-full'>
          <WrappedComponent {...(props as T)} />

          {selected.length === 1 && (
            <div className='max-w-1/2 min-w-1/3'>
              <AnnotationForm
                annotation={selected[0].annotation as Annotation}
                handleDelete={handleDeleteAnnotation}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  return ComponentWithTools;
};
export default withTools;
