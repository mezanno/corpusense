import { useContext } from 'react';
import { AlertDialogContext } from './AlertDialogContext';

export const usePopupContext = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('usePopupContext must be used within a PopupProvider');
  }
  return context;
};
