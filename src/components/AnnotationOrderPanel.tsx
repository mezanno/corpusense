import { Annotation, getAnnotationType } from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { updateAnnotationOrderRequest } from '@/state/reducers/annotations';
import { selectLastOrderByType } from '@/state/selectors/annotations';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { Button } from './ui/button';

const AnnotationOrderPanel = ({ annotation }: { annotation: Annotation }) => {
  const appDispatch = useAppDispatch();
  const lastOrder = useAppSelector((state) =>
    selectLastOrderByType(state, getAnnotationType(annotation)),
  );

  const handlePlus = () => {
    appDispatch(
      updateAnnotationOrderRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? 0) + 1,
      }),
    );
  };

  const handleMinus = () => {
    appDispatch(
      updateAnnotationOrderRequest({
        annotationId: annotation.id,
        value: (annotation.order ?? 0) - 1,
      }),
    );
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
