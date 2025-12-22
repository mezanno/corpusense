import { CanvasScope } from '@/data/models/Scope';
import { generateTextWithAnnotationIdFromCanvas, TextWithAnnotationId } from '@/data/utils/export';
import { useHover } from '@annotorious/react';
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

  useEffect(() => {
    async function fetchText() {
      const txt = await generateTextWithAnnotationIdFromCanvas(scope.canvasId, scope.collectionId);
      setText(txt);
    }
    void fetchText();
  }, [scope]);

  const divText = useMemo(
    () =>
      text.map((line, i) => (
        <div
          key={i}
          className={`mb-1 rounded border border-cyan-700/30 pr-1 pl-1 hover:bg-yellow-100 ${hover?.id === line.annotationId ? 'bg-yellow-100' : ''}`}
          onMouseOver={() => setHovered(line.annotationId)}
        >
          {line.text}
        </div>
      )),
    [text, hover, setHovered],
  );

  return (
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
  );
};

export default CanvasViewerText;
