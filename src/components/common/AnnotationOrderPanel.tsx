import { Button } from '@/components/ui/button';
import { Annotation } from '@/data/models/annotations/annotation';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import '@annotorious/openseadragon/annotorious-openseadragon.css';

const AnnotationOrderPanel = ({
  annotation,
  lastOrder,
}: {
  annotation: Annotation;
  lastOrder: number;
}) => {
  const { updateAnnotationOrder } = useAnnotationActions();

  const handlePlus = () => {
    void (async () => {
      await updateAnnotationOrder(annotation.id, (annotation.order ?? 0) + 1);
    })();
  };

  const handleMinus = () => {
    void (async () => {
      await updateAnnotationOrder(annotation.id, (annotation.order ?? 0) - 1);
    })();
  };

  return (
    <div className='flex items-center gap-2 rounded-xl bg-white/75 p-2'>
      {annotation.order > 1 && (
        <Button className='soft-button' onClick={handleMinus}>
          -
        </Button>
      )}
      {annotation.order}
      {annotation.order < lastOrder && (
        <Button className='soft-button' onClick={handlePlus}>
          +
        </Button>
      )}
    </div>
  );
};

export default AnnotationOrderPanel;
