import { Annotation, ElementType } from '@/data/models/Annotation';
import { getAnnotationsByType } from '@/data/utils/annotations';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useModels } from '@/hooks/data/models/useModels';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MarkupProvider } from '../reducers/MarkupContext';
import TextViewerStage from './TextViewerStage';

const TextViewer = ({ collectionId, canvas }: { collectionId: string; canvas: Canvas }) => {
  const { t } = useTranslation();
  const { getCollectionById } = useCollections();
  const { getModelById } = useModels();
  const collection = getCollectionById(collectionId);
  const containerRef = useRef(null);
  const [text, setText] = useState<Annotation[]>([]);

  const model = getModelById(collection?.modelId ?? '');

  useEffect(() => {
    const getText = async (c: Canvas) => {
      const lines = await getAnnotationsByType(ElementType.TEXT_LINE, c.id, collectionId);
      setText(lines);
    };

    if (canvas !== undefined) {
      void getText(canvas);
    }
  }, [canvas]);

  if (canvas === undefined) {
    return (
      <div className='flex h-full w-full items-center justify-center text-2xl text-red-500'>
        {t('info_no_canvas_selected')}
      </div>
    );
  }

  return (
    <div ref={containerRef} className='h-full w-full'>
      {text.length > 0 ? (
        <>
          {collection?.modelId === undefined ||
            (collection?.modelId.length === 0 && (
              <div className='panel text-red-500'>{t('info_no_model_selected')}</div>
            ))}
          <MarkupProvider text={text} model={model}>
            <AutoSizer ref={containerRef} role='list' className='mt-2 ml-1'>
              {({ height, width }) => (
                <div style={{ width: width, height: height }} className='overflow-auto'>
                  <TextViewerStage />
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
