import { isAnnotationScope, isCanvasScope, Scope } from '@/data/models/Scope';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const ScopeLabel = ({ scope }: { scope: Scope }) => {
  const { t } = useTranslation();
  const { getCollectionById } = useCollections();

  const collection = getCollectionById(scope.collectionId);
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
        className='h-full w-fit underline'
        title={`Lien vers `}
      >
        {isCanvasScope(scope) ? (
          <span>({t('link_open_canvas')})</span>
        ) : (
          <span>({t('link_open_collection')})</span>
        )}
      </Link>
    </div>
  );
};

export default ScopeLabel;
