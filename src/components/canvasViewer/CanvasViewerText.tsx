import { CanvasScope } from '@/data/models/Scope';
import { generateTextFromCanvas } from '@/data/utils/export';
import { useEffect, useMemo, useState } from 'react';

const CanvasViewerText = ({ scope }: { scope: CanvasScope }) => {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    async function fetchText() {
      const txt = await generateTextFromCanvas(scope.canvasId, scope.collectionId);
      setText(txt);
    }
    void fetchText();
  }, [scope]);

  const divText = useMemo(
    () => (
      <div>
        {text.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </div>
    ),
    [text],
  );

  return divText;
};

export default CanvasViewerText;
