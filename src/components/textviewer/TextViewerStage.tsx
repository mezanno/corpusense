import { useAppSelector } from '@/hooks/hooks';
import { hasActiveModel } from '@/state/selectors/models';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useMemo, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import { useMarkupContext } from '../reducers/MarkupContext';
import MarkupContextMenu from './MarkupContextMenu';
import WordLabel from './WordLabel';

const TextViewerStage = () => {
  const { state } = useMarkupContext();
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const hasModel = useAppSelector(hasActiveModel);

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

  useEffect(() => {}, [state.wordRects]);

  const labels = useMemo(() => {
    return state.wordRects.map((wordRect, index) => {
      return <WordLabel key={`${index}-${wordRect.word}`} index={index} word={wordRect.word} />;
    });
  }, [state.text]);

  return (
    <>
      <Stage
        width={state.stage.width}
        height={state.stage.height}
        className={hasModel ? 'cursor-highlighter' : ''}
        onContextMenu={handleContextMenu}
      >
        <Layer>{labels}</Layer>
      </Stage>
      {showMenu && (
        <div style={{ position: 'fixed', top: menuPosition.y, left: menuPosition.x }}>
          <MarkupContextMenu />
        </div>
      )}
    </>
  );
};

export default TextViewerStage;
