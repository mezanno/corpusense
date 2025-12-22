import { CanvasScope } from '@/data/models/Scope';
import { generateTextFromCanvas } from '@/data/utils/export';
import { useEffect, useState } from 'react';

const CanvasViewerText = ({ scope }: { scope: CanvasScope }) => {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    async function fetchText() {
      const txt = await generateTextFromCanvas(scope.canvasId, scope.collectionId);
      setText(txt);
    }
    void fetchText();
  }, [scope]);

  return <div>{text}</div>;
};

export default CanvasViewerText;
