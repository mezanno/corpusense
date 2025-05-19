import { generateTextFromCanvas } from '@/data/utils/export';
import { useAppSelector } from '@/hooks/hooks';
import { getCanvasForComponent } from '@/state/selectors/canvas';
import { getActiveModel } from '@/state/selectors/models';
import { Canvas } from '@iiif/presentation-3';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, Stage } from 'react-konva';
import AutoSizer from 'react-virtualized-auto-sizer';
import AlertDialogForm from './AlertDialogForm';
import MarkupContextMenu from './MarkupContextMenu';
import ModelViewer from './ModelViewer';
import NewModelForm from './NewModelForm';
import { MarkupProvider } from './reducers/MarkupContext';
import SelectModelForm from './SelectModelForm';
import WordLabel from './WordLabel';

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
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const model = useAppSelector(getActiveModel);

  // Create and cleanup context menu
  useEffect(() => {
    // Hide menu on window click
    const handleWindowClick = () => {
      setShowMenu(false);
    };
    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

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

  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (e.target === e.target.getStage()) {
      return;
    }
    const stage = e.target.getStage();
    if (stage === null) {
      return;
    }
    const containerRect = stage.container().getBoundingClientRect();
    const pointerPosition = stage.getPointerPosition() ?? { x: 0, y: 0 };

    setMenuPosition({
      x: containerRect.left + pointerPosition.x + 4,
      y: containerRect.top + pointerPosition.y + 4,
    });
    setShowMenu(true);
  };

  return (
    <div ref={containerRef} className='h-full w-full'>
      {text !== '' ? (
        <>
          {model === null ? (
            <div className='panel flex items-center space-x-2'>
              <div>Aucun modèle de données défini</div>
              <AlertDialogForm
                title={t('btn_select_model')}
                description={t('form_description_select_model')}
                trigger={t('btn_select_model')}
              >
                {({ close }) => <SelectModelForm close={close} />}
              </AlertDialogForm>
              <AlertDialogForm
                title={t('btn_create_model')}
                description={t('form_description_create_model')}
                trigger={t('btn_create_model')}
              >
                {({ close }) => <NewModelForm close={close} />}
              </AlertDialogForm>
            </div>
          ) : (
            <ModelViewer model={model} />
          )}
          <MarkupProvider text={text}>
            <AutoSizer ref={containerRef} role='list'>
              {({ height, width }) => (
                <Stage
                  width={width}
                  height={height}
                  className='cursor-highlighter'
                  onContextMenu={handleContextMenu}
                >
                  <Layer>{labels}</Layer>
                </Stage>
              )}
            </AutoSizer>
            {showMenu && (
              <div style={{ position: 'fixed', top: menuPosition.y, left: menuPosition.x }}>
                <MarkupContextMenu />
              </div>
            )}
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
