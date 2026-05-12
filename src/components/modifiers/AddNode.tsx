import { Plus } from 'lucide-react';

type Props = {
  data: {
    onAdd: () => void;
  };
};

const AddNode = ({ data }: Props) => {
  return (
    <div
      onClick={data.onAdd}
      className='nodrag nopan flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white p-8 hover:border-primary'
    >
      <Plus size={32} />
      <span>Add first modifier</span>
    </div>
  );
};

export default AddNode;
