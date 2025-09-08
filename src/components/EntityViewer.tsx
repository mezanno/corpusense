import { NamedEntity } from '@/data/models/NamedEntity';
import { useAppSelector } from '@/hooks/hooks';
import { selectDatafieldById } from '@/state/selectors/models';

const EntityViewer = ({ entity }: { entity: NamedEntity }) => {
  const datafield = useAppSelector((state) => selectDatafieldById(state, entity.dataFieldId));
  return (
    <div>
      {datafield?.name}
      <span> : </span>
      {entity.value}
    </div>
  );
};

export default EntityViewer;
