import { generateTextFromCanvas } from '@/data/utils/export';
import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForComponent } from '@/state/selectors/canvas';
import { Canvas } from '@iiif/presentation-3';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MarkupProvider } from '../reducers/MarkupContext';
import WordLabel from '../WordLabel';
import ModelViewer from './ModelViewer';
import TextViewerStage from './TextViewerStage';

const textToWords = (text: string) => {
  const lines = text.split('\n');
  const words = lines.map((line) => line.split(' '));
  return words.flat();
};

const TextViewer = ({ name, collectionId }: { name: string; collectionId: string }) => {
  const { t } = useTranslation();
  const canvas = useAppSelector(getCanvasForComponent(name)) as Canvas;
  const containerRef = useRef(null);
  const [text, setText] = useState<string>('');

  useEffect(() => {
    const getText = async () => {
      const generatedText = await generateTextFromCanvas(canvas.id, collectionId);
      setText(generatedText);
    };

    if (canvas !== undefined) {
      void getText();
    }
  }, [canvas]);

  const words = textToWords(text);
  const labels = useMemo(
    () =>
      words.map((word, index) => {
        return <WordLabel key={index} index={index} word={word} />;
      }),
    [text],
  );

  return (
    <div ref={containerRef} className='h-full w-full'>
      {text !== '' ? (
        <>
          <ModelViewer />
          <MarkupProvider text={text}>
            <AutoSizer ref={containerRef} role='list'>
              {({ height, width }) => (
                <div style={{ width: width, height: height }} className='overflow-auto'>
                  <TextViewerStage labels={labels} />
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
