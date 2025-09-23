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
  onConfirm?: {
    message: string;
    action: () => void;
  };
  onCancelMessage?: string;
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
      dialogProps.onConfirm.action();
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
              {dialogProps?.onConfirm?.message !== undefined && (
                <button className='soft-button-danger' onClick={onConfirm}>
                  {dialogProps?.onConfirm?.message}
                </button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialogContext.Provider>
  );
};
