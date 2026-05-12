import { DataModel } from '@/data/models/DataModel';
import { useModelIO } from '@/hooks/data/models/useModelIO';
import { Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';
import { Card, CardContent } from '../ui/card';
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
      className={`card-model flex w-full max-w-[300px] flex-col justify-evenly overflow-hidden p-2 ${model.id === selectedModelId ? 'bg-white' : 'bg-white/50'} `}
      onClick={() => setSelectedModelId(model.id)}
      style={{ cursor: 'pointer' }}
    >
      <CardContent className='flex w-full justify-between gap-1'>
        <h3 className='truncate text-left text-sm font-bold' title={model.name}>
          {model.name}
        </h3>
        <div className='flex gap-x-1'>
          <div
            onClick={handleRemoveConvertedFile}
            title={t('btn_delete')}
            aria-label={t('btn_delete')}
            className='cursor-pointer text-red-400 hover:text-red-600'
          >
            <Trash2 size={20} />
          </div>
          <div
            onClick={handleDownloadModel}
            title={t('btn_download_model')}
            aria-label={t('btn_download_model')}
            className='cursor-pointer text-black/50 hover:text-black'
          >
            <Download size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
