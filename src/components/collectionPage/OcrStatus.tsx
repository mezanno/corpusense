import useCollectionOcrStatus from '@/hooks/data/collections/useCollectionOcrStatus';
import { BookA } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OcrStatus = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const hasOcr = useCollectionOcrStatus({ collectionId });

  if (!hasOcr) {
    return null;
  }
  return (
    <div title={t('info_ocr_available')} className='flex items-center gap-1'>
      <BookA />
    </div>
  );
};

export default OcrStatus;
