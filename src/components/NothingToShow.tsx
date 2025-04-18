import { CircleSlash2 } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const NothingToShow = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className='flex w-full flex-col items-center space-y-2 text-mezanno-4'>
      <CircleSlash2 size={64} />
      <div role='alert' className='text-2xl'>
        {t('error_nothing_toshow')}
      </div>
      {children}
    </div>
  );
};

export default NothingToShow;
