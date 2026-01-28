import { DataModel } from '@/data/models/DataModel';
import { useModelIO } from '@/hooks/data/models/useModelIO';
import { Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';
import { Card, CardContent, CardFooter } from '../ui/card';
// import ReactJsonView from '@microlink/react-json-view';

export function ModelCard({
  model,
  selectedModelId,
  setSelectedModelId,
}: {
  model: DataModel;
  selectedModelId: string | null;
  setSelectedModelId: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const { removeModel, exportModel } = useModelIO();

  const handleRemoveConvertedFile: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_model'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => {
          void removeModel(model.id);
          if (selectedModelId === model.id) {
            setSelectedModelId(null);
          }
        },
      },
    });
  };

  const handleDownloadModel: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    void (async () => {
      await exportModel(model.id);
    })();
  };

  return (
    <Card
      className={`card-model flex flex-col justify-evenly overflow-hidden ${model.id === selectedModelId ? 'bg-white' : 'bg-white/50'} `}
      onClick={() => setSelectedModelId(model.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* <CardHeader className='overflow-hidden'>{model.name}</CardHeader> */}
      <CardContent className='flex flex-col justify-center'>
        <h3 className='font-bold wrap-break-word' title={model.name}>
          {model.name}
          {/* <ReactJsonView
            src={JSON.parse(generateSchema(model)) as object}
            collapsed={1}
            enableClipboard={false}
          /> */}
        </h3>
      </CardContent>
      <CardFooter className='flex justify-end space-x-2'>
        <div
          onClick={handleRemoveConvertedFile}
          title={t('btn_delete')}
          aria-label={t('btn_delete')}
        >
          <Trash2 size={20} />
        </div>
        <div
          onClick={handleDownloadModel}
          title={t('btn_download_model')}
          aria-label={t('btn_download_model')}
        >
          <Download size={20} />
        </div>
      </CardFooter>
    </Card>
  );
}
