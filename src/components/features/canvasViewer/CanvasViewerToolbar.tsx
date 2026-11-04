import ResultsAvailable from '@/components/common/ResultsAvailable';
import Toolbar from '@/components/common/ToolBar';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import useDialog from '@/hooks/ui/useDialog';
import { Canvas } from '@iiif/presentation-3';
import { Book, BookOpenText, Eye, EyeOff, NotebookPen, Wrench } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CanvasViewerMode } from './CanvasViewer';

const CanvasViewerToolbar = ({
  collectionId,
  canvas,
  mode,
  setMode,
  showAnnotations,
  toggleAnnotations,
  toggleText,
  showText,
  toggleMoidifiers,
  showModifiers,
  annotationScale,
  setAnnotationScale,
}: {
  collectionId: string;
  canvas: Canvas;
  mode: CanvasViewerMode;
  setMode: (mode: CanvasViewerMode) => void;
  showAnnotations: boolean;
  toggleAnnotations: () => void;
  toggleText: () => void;
  showText: boolean;
  toggleMoidifiers: () => void;
  showModifiers: boolean;
  annotationScale: number;
  setAnnotationScale: (scale: number) => void;
}) => {
  const { t } = useTranslation();
  const { openRemoveAnnotationsDialog } = useDialog();
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({ collectionId });

  const handleDeleteAllAnnotations = () => {
    openRemoveAnnotationsDialog({ canvasId: canvas.id, collectionId });
  };

  const handleAddAnnotation = () => {
    setMode(mode === CanvasViewerMode.DRAW ? CanvasViewerMode.MOVE : CanvasViewerMode.DRAW);
  };

  const currentCanvasScope = useMemo(
    () => ({
      canvasId: canvas.id,
      collectionId,
    }),
    [canvas.id, collectionId],
  );

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
          <div className='flex h-full space-x-2'>
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
            <Toggle
              className='soft-button'
              size={null}
              onClick={toggleMoidifiers}
              pressed={showModifiers}
            >
              {showModifiers ? <Wrench size={24} /> : <Wrench />}
            </Toggle>
            <Slider
              max={2}
              min={0}
              step={0.01}
              value={[annotationScale]}
              className='w-40'
              onValueChange={(value) => setAnnotationScale(value[0])}
            />
            <Label className='text-sm'>{annotationScale}</Label>
          </div>
          <ResultsAvailable scope={currentCanvasScope} />
        </div>
      )}
    </div>
  );
};

export default CanvasViewerToolbar;
