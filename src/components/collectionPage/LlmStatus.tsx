import useCollectionLlmStatus from '@/hooks/data/collections/useCollectionLlmStatus';
import { Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LlmStatus = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const hasLlmResult = useCollectionLlmStatus({ collectionId });

  if (!hasLlmResult) {
    return null;
  }
  return (
    <div title={t('info_lllm_available')} className='flex items-center gap-1'>
      <Braces />
    </div>
  );
};

export default LlmStatus;
