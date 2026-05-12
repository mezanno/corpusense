import { NamedEntity } from '@/data/models/NamedEntity';
import { useModels } from '@/hooks/data/models/useModels';

const EntityViewer = ({ entity }: { entity: NamedEntity }) => {
  const datafield = useModels().getDatafieldById(entity.dataFieldId);
  return (
    <div>
      {datafield?.name}
      <span> : </span>
      {entity.value}
    </div>
  );
};

export default EntityViewer;
