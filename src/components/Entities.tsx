import { Annotation } from '@/data/models/Annotation';
import { useAppSelector } from '@/hooks/hooks';
import { getEntitiesByAnnotationId } from '@/state/selectors/namedEntity';
import { useTranslation } from 'react-i18next';
import EntityViewer from './EntityViewer';

const Entities = ({ annotation }: { annotation: Annotation }) => {
  const { t } = useTranslation();
  const entities = useAppSelector((state) =>
    annotation !== null ? getEntitiesByAnnotationId(state, annotation.id) : [],
  );

  if (entities.length === 0) {
    return null;
  }
  return (
    <div>
      <h2 className='font-bold'>{t('title_entities_in_annotation')}</h2>
      {entities.map((e) => (
        <EntityViewer key={e.id} entity={e} />
      ))}
    </div>
  );
};

export default Entities;
