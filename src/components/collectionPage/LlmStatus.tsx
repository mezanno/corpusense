import useCollectionLlmStatus from '@/hooks/data/collections/useCollectionLlmStatus';
import ReactJsonView from '@microlink/react-json-view';
import { Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconWithTooltip } from '../IconWithTooltip';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';

const LlmStatus = ({ collectionId }: { collectionId: string }) => {
  const { t } = useTranslation();
  const { openDialog } = useAlertDialogContext();
  const { hasLlmResult, getResultData } = useCollectionLlmStatus({ collectionId });

  if (!hasLlmResult) {
    return null;
  }

  const handleClick = async () => {
    const data = await getResultData();
    openDialog({
      title: t('title_structured_data'),
      children: (
        <div className='whitespace-pre-line'>
          {data ? (
            <ReactJsonView src={data} displayObjectSize={false} displayDataTypes={false} />
          ) : (
            'oups'
          )}
        </div>
      ),
    });
  };

  return (
    <IconWithTooltip tooltip={t('info_lllm_available')} onClick={() => void handleClick()}>
      <Braces />
    </IconWithTooltip>
  );
};

export default LlmStatus;
