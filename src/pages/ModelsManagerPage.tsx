import ModelsDashboard from '@/components/models/ModelsDashboard';
import ModelViewer from '@/components/ModelViewer';
import QuickCanvasViewer from '@/components/QuickCanvasViewer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Container, EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ModelsManagerPage = () => {
  const { t } = useTranslation();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [canvasViewVisible, setCanvasViewVisible] = useState(false);

  return (
    <div className='flex h-full w-full flex-col space-y-2 p-4'>
      <h1 className='flex items-center text-2xl font-bold'>
        <Container className='mr-2' /> {t('page_title_models_manager')}
      </h1>
      <div className='mb-1 flex justify-between'>
        <button
          className={`soft-button ${canvasViewVisible ? '' : 'bg-transparent'}`}
          title={t('btn_toggle_canvas_view')}
          aria-label={t('btn_toggle_canvas_view')}
        >
          <EyeIcon onClick={() => setCanvasViewVisible(!canvasViewVisible)} />
        </button>
      </div>
      <ModelsDashboard setSelectedModelId={setSelectedModelId} selectedModelId={selectedModelId} />
      <ResizablePanelGroup direction='horizontal' className='flex-1 space-x-2'>
        <ResizablePanel order={1} id='metadata-panel' className='flex flex-col' minSize={50}>
          {selectedModelId !== null && <ModelViewer modelId={selectedModelId} />}
        </ResizablePanel>
        {canvasViewVisible && (
          <>
            <ResizableHandle withHandle className='w-1 cursor-col-resize bg-dark-slate-gray' />
            <ResizablePanel id='canvas-panel' order={3} minSize={25} className='panel'>
              <QuickCanvasViewer />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default ModelsManagerPage;
