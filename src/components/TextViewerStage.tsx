import { KonvaEventObject } from 'konva/lib/Node';
import { ReactNode, useEffect, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import MarkupContextMenu from './MarkupContextMenu';
import { useMarkupContext } from './reducers/MarkupContext';

const TextViewerStage = ({ labels }: { labels: ReactNode }) => {
  const { state } = useMarkupContext();
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);

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

  return (
    <>
      <Stage
        width={state.stage.width}
        height={state.stage.height}
        className='cursor-highlighter'
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
