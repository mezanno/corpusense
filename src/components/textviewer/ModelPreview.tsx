import { DataModel } from '@/data/models/DataModel';
import { generateSchema } from '@/data/utils/model';

//@ts-expect-error close is unused
const ModelPreview = ({ close, model }: { close: () => void; model: DataModel }) => {
  return <div>{JSON.stringify(generateSchema(model))}</div>;
};

export default ModelPreview;
