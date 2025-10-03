import { useTranslation } from 'react-i18next';
import { Spinner } from './ui/spinner';

const Loading = () => {
  const { t } = useTranslation();

  return (
    <div
      className='flex h-full w-full flex-col items-center justify-center text-dark-slate-gray-300'
      aria-busy='true'
      aria-live='polite'
      role='status'
    >
      <Spinner size={'large'} className='text-dark-slate-gray-300' />
      <span className='text-dark-slate-gray-300'>{t('info_loading')}</span>
    </div>
  );
};

export default Loading;
