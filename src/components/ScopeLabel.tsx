import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { useAppSelector } from '@/hooks/hooks';
import { selectCollectionById } from '@/state/selectors/collections';

const ScopeLabel = ({ scope }: { scope: Scope }) => {
  const collection = useAppSelector((state) => selectCollectionById(state, scope.collectionId));
  return (
    <div className='flex flex-col'>
      <div>Collection {collection?.name}</div>
      {isCanvasScope(scope) && <div>Canvas {scope.canvasId}</div>}
      {isAnnotationScope(scope) && <div>Canvas {scope.annotationId}</div>}
    </div>
  );
};

export default ScopeLabel;
