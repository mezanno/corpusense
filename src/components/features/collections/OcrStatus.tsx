import { IconWithTooltip } from '@/components/common/IconWithTooltip';
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { generateTextForCollection } from '@/data/utils/export';
import useCollectionOcrStatus from '@/hooks/data/collections/useCollectionOcrStatus';
import { BookA } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OcrStatus = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const hasOcr = useCollectionOcrStatus({ collectionId });

  if (!hasOcr) {
    return null;
  }

  const handleClick = async () => {
    const textResult = await generateTextForCollection(collectionId);

    if (!textResult.ok) {
      openDialog({
        title: t('title_ocr_text'),
        children: <div className='whitespace-pre-line'>{t('error_ocr_text')}</div>,
      });
      return;
    }

    const text = textResult.value;
    openDialog({
      title: t('title_ocr_text'),
      children: <div className='whitespace-pre-line'>{text}</div>,
    });
  };

  return (
    <IconWithTooltip tooltip={t('info_ocr_available')} onClick={() => void handleClick()}>
      <BookA />
    </IconWithTooltip>
  );
};

export default OcrStatus;
