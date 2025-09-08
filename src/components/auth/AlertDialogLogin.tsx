import { useAppSelector } from '@/hooks/hooks';
import { selectAuthStatus } from '@/state/selectors/auth';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import LoginForm from './LoginForm';

const AlertDialogLogin = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  const { t } = useTranslation();
  const authStatus = useAppSelector(selectAuthStatus);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      setIsOpen(false);
    }
  }, [authStatus]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title_login')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description_login')}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className='w-full'>
          <LoginForm />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>{t('btn_cancel')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogLogin;
