import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

const ErrorDialog = () => {
  const { t } = useTranslation();
  // const appDispatch = useAppDispatch();
  // const { lastError: manifestError } = useAppSelector((state) => state.manifests);
  const [message, setMessage] = useState('');

  // useEffect(() => {
  //   if (manifestError === null || manifestError === '') return;
  //   setMessage(t('error_loading_manifest', { error: manifestError }));
  // }, [manifestError, t]);

  const handleClose = () => {
    setMessage('');
    //   appDispatch(resetLastError());
  };

  if (message === '') return null;

  return (
    <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
      <AlertDialog open={message !== ''}>
        <AlertDialogContent className='border-red-500'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle />
              {t('oups')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('error_occured')}</AlertDialogDescription>
          </AlertDialogHeader>
          {message}
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>{t('btn_continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ErrorDialog;
