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
    closeOnAction?: boolean; //indique si le dialog doit se fermer après l'action de confirmation (optionnel, défaut true)
  };
  onCancelMessage?: string;
};

//AlertDialogContextType indique les fonctions et états disponibles dans le contexte
type AlertDialogContextType = {
  openDialog: (props: DialogProps) => void; //ouvre le dialog avec les propriétés spécifiées
  setCanSubmit: (enable: boolean) => void; //indique si le bouton de confirmation doit être actif (en fonction de la validité du formulaire)
  closeDialog: () => void; //fonction de fermeture du dialog à passer aux formulaires qui en auraient besoin (pour une fermeture différée, ex : login)
};

export const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export const AlertDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [dialogProps, setDialogProps] = useState<DialogProps | null>(null);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);

  const openDialog = (props: DialogProps) => {
    setCanSubmit(true); //initialise canSubmit à true par défaut
    setDialogProps(props);
  }; //fonction permettant d'ouvrir le dialog avec les propriétés spécifiées
  const closeDialog = () => setDialogProps(null);

  const onConfirm = () => {
    /*
      Exécute l'action de confirmation si définie, puis ferme le dialog si closeOnAction est true (par défaut)
      Cetete fonction est appelée lorsque l'utilisateur clique sur le bouton de confirmation
    */
    if (dialogProps?.onConfirm) {
      dialogProps.onConfirm.action();
    }
    if (dialogProps?.onConfirm?.closeOnAction ?? true) {
      closeDialog();
    }
  };

  return (
    <AlertDialogContext.Provider value={{ openDialog, setCanSubmit, closeDialog }}>
      {children}
      {dialogProps !== null && (
        <AlertDialog open={true} onOpenChange={closeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogProps?.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogProps?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {dialogProps.children}
            <AlertDialogFooter>
              <button className='soft-button' onClick={closeDialog}>
                {dialogProps?.onCancelMessage ?? t('btn_cancel')}
              </button>
              {dialogProps?.onConfirm?.message !== undefined && (
                <button
                  className={canSubmit === true ? 'soft-button-danger' : 'soft-button-disabled'}
                  onClick={onConfirm}
                  disabled={canSubmit === false}
                >
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
