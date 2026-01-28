import CollectionInspectorContent from '@/components/CollectionInspectorContent';
import { AnnotationContextProvider } from '@/components/reducers/AnnotationContext';
import 'gridstack/dist/gridstack.min.css';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';

const CollectionInspectorPage = () => {
  const { t } = useTranslation();
  const { collectionId } = useParams();
  const [searchParams] = useSearchParams();

  const canvasId = useMemo(() => {
    return searchParams.get('canvas');
  }, [searchParams]);

  return collectionId === undefined ? (
    <div className='flex justify-center'>{t('error_id_collection_invalid')}</div>
  ) : (
    <AnnotationContextProvider>
      <CollectionInspectorContent collectionId={collectionId} defaultCanvasId={canvasId} />
    </AnnotationContextProvider>
  );
};

export default CollectionInspectorPage;
