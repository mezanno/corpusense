import { DataModel } from '@/data/models/DataModel';
import { generateSchema } from '@/data/utils/model';
import ReactJsonView from '@microlink/react-json-view';

//@ts-expect-error close is unused
const ModelPreview = ({ close, model }: { close: () => void; model: DataModel }) => {
  return (
    <ReactJsonView
      src={JSON.parse(generateSchema(model)) as object}
      collapsed={2}
      enableClipboard={false}
    />
  );
};

export default ModelPreview;
