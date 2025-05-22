import { Annotation, ElementType } from '@/data/models/Annotation';
import { getAnnotationsByType } from '@/data/utils/annotations';
import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForComponent } from '@/state/selectors/canvas';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MarkupProvider } from '../reducers/MarkupContext';
import ModelViewer from './ModelViewer';
import TextViewerStage from './TextViewerStage';

const TextViewer = ({ name, collectionId }: { name: string; collectionId: string }) => {
  const { t } = useTranslation();
  const canvas = useAppSelector(getCanvasForComponent(name)) as Canvas;
  const containerRef = useRef(null);
  const [text, setText] = useState<Annotation[]>([]);

  useEffect(() => {
    const getText = async () => {
      const lines = await getAnnotationsByType(ElementType.LINE, canvas.id, collectionId);
      setText(lines);
    };

    if (canvas !== undefined) {
      void getText();
    }
  }, [canvas]);

  return (
    <div ref={containerRef} className='h-full w-full'>
      {text.length > 0 ? (
        <>
          <ModelViewer />
          <MarkupProvider>
            <AutoSizer ref={containerRef} role='list'>
              {({ height, width }) => (
                <div style={{ width: width, height: height }} className='overflow-auto'>
                  <TextViewerStage text={text} />
                </div>
              )}
            </AutoSizer>
          </MarkupProvider>
        </>
      ) : (
        <div className='flex h-full w-full items-center justify-center text-2xl text-red-500'>
          {t('error_export_no_text')}
        </div>
      )}
    </div>
  );
};

export default TextViewer;
