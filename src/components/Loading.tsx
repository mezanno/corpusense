import { useTranslation } from 'react-i18next';
import { Spinner } from './ui/spinner';

const Loading = () => {
  const { t } = useTranslation();

  return (
    <div
      className='flex h-full w-full items-center justify-center'
      aria-busy='true'
      aria-live='polite'
      role='status'
    >
      <Spinner size={'large'} />
      <span className='sr-only'>{t('info_loading')}</span>
    </div>
  );
};

export default Loading;
