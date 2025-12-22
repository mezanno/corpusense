import { ElementType } from '@/data/models/Annotation';
import useDialog from '@/hooks/ui/useDialog';
import { Canvas } from '@iiif/presentation-3';
import { Book, BookOpenText, Eye, EyeOff, Layout, NotebookPen } from 'lucide-react';
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
  toggleText,
  showText,
}: {
  collectionId: string;
  canvas: Canvas;
  mode: CanvasViewerMode;
  setMode: (mode: CanvasViewerMode) => void;
  showAnnotations: boolean;
  toggleAnnotations: () => void;
  toggleText: () => void;
  showText: boolean;
}) => {
  const { t } = useTranslation();
  const { openDuplicateLayoutDialog, openRemoveAnnotationsDialog } = useDialog();
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({ collectionId });

  const { getAnnotationsByTypes } = useAnnotationContext();

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

  return (
    <div className='flex w-full flex-col'>
      <h4 className='w-full border-b text-center text-sm italic'>{canvas.id}</h4>
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
          <Toggle className='soft-button' size={null} onClick={toggleText} pressed={showText}>
            {showText ? <BookOpenText size={24} /> : <Book />}
          </Toggle>
        </div>
      )}
    </div>
  );
};

export default CanvasViewerToolbar;
