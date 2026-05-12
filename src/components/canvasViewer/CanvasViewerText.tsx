import { CanvasScope } from '@/data/models/Scope';
import { generateTextWithAnnotationIdFromCanvas, TextWithAnnotationId } from '@/data/utils/export';
import { useHover } from '@annotorious/react';
import { Magnet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

const CanvasViewerText = ({
  scope,
  setHovered,
}: {
  scope: CanvasScope;
  setHovered: (id: string | null) => void;
}) => {
  const hover = useHover();
  const [text, setText] = useState<TextWithAnnotationId>([]);
  const [snapToAnnotation, setSnapToAnnotation] = useState(false);

  useEffect(() => {
    async function fetchText() {
      const txt = await generateTextWithAnnotationIdFromCanvas(scope.canvasId, scope.collectionId);
      setText(txt);
    }
    void fetchText();
  }, [scope]);

  const toggleSnap = () => {
    setSnapToAnnotation(!snapToAnnotation);
  };

  const divText = useMemo(
    () =>
      text.map((line, i) => (
        <div
          key={i}
          className={`mb-1 min-h-5 rounded border border-cyan-700/30 pr-1 pl-1 hover:bg-yellow-100 ${hover?.id === line.annotationId ? 'bg-yellow-100' : ''}`}
          onMouseOver={() => {
            if (snapToAnnotation) setHovered(line.annotationId);
          }}
        >
          {line.text}
        </div>
      )),
    [text, hover, setHovered, snapToAnnotation],
  );

  return (
    <div className='flex h-full w-1/2'>
      <div>
        <Magnet
          onClick={toggleSnap}
          className={`${snapToAnnotation === true ? 'bg-white' : 'bg-red'} m-1 rounded p-1`}
        />
      </div>
      <div className='flex-1 overflow-y-auto'>
        <AutoSizer>
          {({ width, height }) => {
            return (
              <div
                style={{
                  width,
                  height,
                  overflow: 'auto',
                  position: 'relative',
                  marginRight: '1px',
                }}
              >
                {divText}
              </div>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

export default CanvasViewerText;
