import { ModifierChainDTO } from '@/data/models/modifiers/Modifier';
import useModifierChainIO from '@/hooks/data/modifiers/useModifierChainIO';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';
import { Card, CardContent, CardFooter } from '../ui/card';

export function ModifierChainCard({
  chain,
  selectedChainId,
  setSelectedChainId,
}: {
  chain: ModifierChainDTO;
  selectedChainId: string | null;
  setSelectedChainId: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const { removeModifierChain } = useModifierChainIO();

  const handleRemoveConvertedFile: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_modifierchain'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => {
          void removeModifierChain(chain.id);
          if (selectedChainId === chain.id) {
            setSelectedChainId(null);
          }
        },
      },
    });
  };

  // const handleDownloadModel: React.MouseEventHandler<HTMLDivElement> = (event) => {
  //   event.stopPropagation();
  //   void (async () => {
  //     //   await exportModel(chain.id);
  //   })();
  // };

  return (
    <Card
      className={`card-model flex flex-col justify-evenly overflow-hidden ${chain.id === selectedChainId ? 'bg-white' : 'bg-white/50'} `}
      onClick={() => setSelectedChainId(chain.id)}
      style={{ cursor: 'pointer' }}
    >
      <CardContent className='flex flex-col justify-center'>
        <h3 className='font-bold wrap-break-word' title={chain.name}>
          {chain.name}
        </h3>
      </CardContent>
      <CardFooter className='flex justify-end space-x-2'>
        <div
          onClick={handleRemoveConvertedFile}
          title={t('btn_delete')}
          aria-label={t('btn_delete')}
          className='cursor-pointer text-red-400 hover:text-red-600'
        >
          <Trash2 size={20} />
        </div>
        {/* <div
          onClick={handleDownloadModel}
          title={t('btn_download_model')}
          aria-label={t('btn_download_model')}
        >
          <Download size={20} />
        </div> */}
      </CardFooter>
    </Card>
  );
}
