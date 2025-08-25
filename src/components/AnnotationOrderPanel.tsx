import { Annotation } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { updateAnnotationOrderValueRequest } from '@/state/reducers/annotations';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Button } from './ui/button';

const AnnotationOrderPanel = ({ annotation }: { annotation: Annotation }) => {
  const appDispatch = useAppDispatch();

  const handlePlus = () => {
    appDispatch(
      updateAnnotationOrderValueRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? 0) + 1,
      }),
    );
  };

  const handleMinus = () => {
    appDispatch(
      updateAnnotationOrderValueRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? 0) - 1,
      }),
    );
  };

  return (
    <div className='flex items-center gap-2 rounded-xl bg-white/75 p-2'>
      <Button className='soft-button' onClick={handleMinus}>
        -
      </Button>
      {annotation.order}
      <Button className='soft-button' onClick={handlePlus}>
        +
      </Button>
    </div>
  );
};

export default AnnotationOrderPanel;
