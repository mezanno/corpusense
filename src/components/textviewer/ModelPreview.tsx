import { DataModel } from '@/data/models/DataModel';
import { generatePreview } from '@/data/utils/model';

//@ts-expect-error close is unused
const ModelPreview = ({ close, model }: { close: () => void; model: DataModel }) => {
  return <div>{generatePreview(model)}</div>;
};

export default ModelPreview;
