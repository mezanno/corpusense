import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { useAppSelector } from '@/hooks/hooks';
import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { selectCollectionById } from '@/state/selectors/collections';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const ScopeLabel = ({ scope }: { scope: Scope }) => {
  const { t } = useTranslation();
  const collection = useAppSelector((state) => selectCollectionById(state, scope.collectionId));
  return (
    <div className='flex flex-col'>
      <div>Collection {collection?.name}</div>
      {isCanvasScope(scope) && (
        <div className='break-all' title={scope.canvasId}>
          Canvas {scope.canvasId}
        </div>
      )}
      {isAnnotationScope(scope) && <div>Annotation {scope.annotationId}</div>}

      <Link
        to={`/${CorpusenseRoutes.COLLECTIONS}/${scope.collectionId}${
          isCanvasScope(scope) ? '?canvas=' + scope.canvasId : ''
        }`}
        className='h-full underline'
        title={`Lien vers `}
      >
        ({t('link_open_element')})
      </Link>
    </div>
  );
};

export default ScopeLabel;
