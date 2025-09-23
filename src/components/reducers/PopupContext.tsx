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

type PopupProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  onConfirmMessage?: string;
  onCancelMessage?: string;
  onConfirm?: () => void;
};

type PopupContextType = {
  showPopup: (props: PopupProps) => void;
};

export const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [popupProps, setPopupProps] = useState<PopupProps | null>(null);

  const showPopup = (props: PopupProps) => setPopupProps(props);
  const closePopup = () => setPopupProps(null);
  const onConfirm = () => {
    if (popupProps?.onConfirm) {
      popupProps.onConfirm();
    }
    closePopup();
  };

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}
      {popupProps !== null && (
        <AlertDialog open={true} onOpenChange={closePopup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{popupProps?.title}</AlertDialogTitle>
              <AlertDialogDescription>{popupProps?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {popupProps.children}
            <AlertDialogFooter>
              <button className='soft-button' onClick={closePopup}>
                {popupProps?.onCancelMessage ?? t('btn_cancel')}
              </button>
              {popupProps?.onConfirmMessage !== undefined && (
                <button className='soft-button-danger' onClick={onConfirm}>
                  {popupProps?.onConfirmMessage}
                </button>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PopupContext.Provider>
  );
};
