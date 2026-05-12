import { generateTextForCollection } from '@/data/utils/export';
import useCollectionOcrStatus from '@/hooks/data/collections/useCollectionOcrStatus';
import { BookA } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconWithTooltip } from '../IconWithTooltip';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';

const OcrStatus = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const hasOcr = useCollectionOcrStatus({ collectionId });

  if (!hasOcr) {
    return null;
  }

  const handleClick = async () => {
    const text = await generateTextForCollection(collectionId);
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
