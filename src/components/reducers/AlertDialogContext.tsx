import { createContext, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

type DialogProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  onConfirmMessage?: string;
  onCancelMessage?: string;
  onConfirm?: () => void;
};

type AlertDialogContextType = {
  openDialog: (props: DialogProps) => void;
};

export const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export const AlertDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [dialogProps, setDialogProps] = useState<DialogProps | null>(null);

  const openDialog = (props: DialogProps) => setDialogProps(props);
  const closePopup = () => setDialogProps(null);
  const onConfirm = () => {
    if (dialogProps?.onConfirm) {
      dialogProps.onConfirm();
    }
    closePopup();
  };

  return (
    <AlertDialogContext.Provider value={{ openDialog }}>
      {children}
      {dialogProps !== null && (
        <AlertDialog open={true} onOpenChange={closePopup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogProps?.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogProps?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {dialogProps.children}
            <AlertDialogFooter>
              <button className='soft-button' onClick={closePopup}>
                {dialogProps?.onCancelMessage ?? t('btn_cancel')}
              </button>
              {dialogProps?.onConfirmMessage !== undefined && (
                <button className='soft-button-danger' onClick={onConfirm}>
                  {dialogProps?.onConfirmMessage}
                </button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialogContext.Provider>
  );
};
