import { ElementType } from '@/data/models/Annotation';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import useDialog from '@/hooks/ui/useDialog';
import { useSelection } from '@annotorious/react';
import { Canvas } from '@iiif/presentation-3';
import { Eye, EyeOff, Layout, NotebookPen } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnotationContext } from '../reducers/AnnotationContext';
import { useWorkerContext } from '../reducers/WorkerContext';
import Toolbar from '../ToolBar';
import { Toggle } from '../ui/toggle';
import { CanvasViewerMode } from './CanvasViewer';

export const CanvasViewerToolbar = ({
  collectionId,
  canvas,
  mode,
  setMode,
  showAnnotations,
  toggleAnnotations,
}: {
  collectionId: string;
  canvas: Canvas;
  mode: CanvasViewerMode;
  setMode: (mode: CanvasViewerMode) => void;
  showAnnotations: boolean;
  toggleAnnotations: () => void;
}) => {
  const { t } = useTranslation();
  const { openDuplicateLayoutDialog, openRemoveAnnotationsDialog } = useDialog();
  const { selected } = useSelection(); //the annotation(s) selected in the annotorious viewer
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({ collectionId });

  const { getAnnotationsByTypes } = useAnnotationContext();
  const { removeAnnotationsByIds } = useAnnotationActions();

  const regionAnnotations = getAnnotationsByTypes([ElementType.TEXT_REGION]);

  const handleDeleteAllAnnotations = () => {
    openRemoveAnnotationsDialog({ canvasId: canvas.id, collectionId });
  };

  const handleDuplicateLayout = () => {
    openDuplicateLayoutDialog({
      canvasId: canvas.id,
      collectionId,
    });
  };

  const handleAddAnnotation = () => {
    setMode(mode === CanvasViewerMode.DRAW ? CanvasViewerMode.MOVE : CanvasViewerMode.DRAW);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    console.log('handleKeyDown: ', selected);

    if (event.key === 'Delete' && selected?.length > 0) {
      const ids = selected.map((s) => s.annotation.id);
      void (async () => {
        await removeAnnotationsByIds(ids); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
      })();
    }
  };

  return (
    <div className='flex w-full flex-col' onKeyDown={handleKeyDown}>
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
              collectionId,
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
            onClick={toggleAnnotations}
            pressed={showAnnotations}
          >
            {showAnnotations ? <Eye size={24} /> : <EyeOff size={24} />}
          </Toggle>
        </div>
      )}
    </div>
  );
};

export default CanvasViewerToolbar;
