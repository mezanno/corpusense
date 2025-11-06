import { Annotation, ElementType } from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import { removeAnnotationsByIdsRequest } from '@/state/reducers/annotations';
import { selectAnnotationsByType } from '@/state/selectors/annotations';
import { selectIsWorkerOrTaskRunning } from '@/state/selectors/workers';
import { RootState } from '@/state/store';
import { useSelection } from '@annotorious/react';
import { Eye, EyeOff, Layout, NotebookPen } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import AnnotationForm from './forms/AnnotationForm';
import { CanvasViewerMode } from './reducers/CanvasViewerContext';
import { useCanvasViewerContext } from './reducers/useCanvasViewerContext';
import Toolbar from './ToolBar';
import { Toggle } from './ui/toggle';

export const withTools = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
  const ComponentWithTools = (props: { collectionId: string }) => {
    const appDispatch = useAppDispatch();
    const { t } = useTranslation();
    const { setMode, toggleAnnotations, showAnnotations, canvas, mode } = useCanvasViewerContext(); //the reducer/state of the canvas viewer
    const { openDuplicateLayoutDialog, openRemoveAnnotationsDialog } = useDialog();
    const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
    const isWorkerRunning = useAppSelector((state) =>
      selectIsWorkerOrTaskRunning(state, { collectionId: props.collectionId }),
    );

    const regionAnnotations = useSelector((state: RootState) =>
      selectAnnotationsByType(state, ElementType.TEXT_REGION),
    );

    if (canvas === undefined) {
      return null;
    }

    const handleDeleteAllAnnotations = () => {
      openRemoveAnnotationsDialog({ canvasId: canvas.id, collectionId: props.collectionId });
    };

    const handleDuplicateLayout = () => {
      openDuplicateLayoutDialog({
        canvasId: canvas.id,
        collectionId: props.collectionId,
      });
    };

    const handleAddAnnotation = () => {
      setMode(mode === CanvasViewerMode.DRAW ? CanvasViewerMode.MOVE : CanvasViewerMode.DRAW);
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

    const handleToggleShowAnnotations = () => {
      toggleAnnotations();
    };

    return (
      <div className='flex h-full w-full flex-col' onKeyDown={handleKeyDown}>
        <h4 className='w-full border-b-1 text-center text-sm italic'>{canvas.id}</h4>
        {isWorkerRunning ? (
          <div>
            <strong>{t('info_worker_running')}</strong>
          </div>
        ) : (
          <div className='m-1 flex h-auto w-full gap-2 space-x-2'>
            <Toolbar
              handleDeleteAllAnnotations={handleDeleteAllAnnotations}
              scope={{
                canvasId: canvas?.id ?? '',
                collectionId: props.collectionId ?? '',
              }}
            />
            {regionAnnotations.length > 0 && (
              <button
                className='soft-button'
                title={t('btn_duplicate_regions')}
                onClick={handleDuplicateLayout}
              >
                <Layout />
              </button>
            )}
            <Toggle
              className='soft-button'
              size={null}
              title={t('btn_add_annotation')}
              onClick={handleAddAnnotation}
              pressed={mode === CanvasViewerMode.DRAW}
            >
              <NotebookPen size={24} />
            </Toggle>
            <Toggle
              className='soft-button'
              size={null}
              title={`${showAnnotations ? t('btn_hide_annotations') : t('btn_show_annotations')}`}
              onClick={handleToggleShowAnnotations}
              pressed={showAnnotations}
            >
              {showAnnotations ? <Eye size={24} /> : <EyeOff size={24} />}
            </Toggle>
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
