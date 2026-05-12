import { Annotation } from '@/data/models/Annotation';
import useNamedEntities from '@/hooks/data/namedEntities/useNamedEntities';
import { useTranslation } from 'react-i18next';
import EntityViewer from './EntityViewer';

const Entities = ({ annotation }: { annotation: Annotation }) => {
  const { t } = useTranslation();
  const { namedEntities } = useNamedEntities([annotation.id]);

  if (namedEntities.length === 0) {
    return null;
  }
  return (
    <div>
      <h2 className='font-bold'>{t('title_entities_in_annotation')}</h2>
      {namedEntities.map((e) => (
        <EntityViewer key={e.id} entity={e} />
      ))}
    </div>
  );
};

export default Entities;
