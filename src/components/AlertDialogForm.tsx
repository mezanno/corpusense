import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

type AlertCollectionDialogProps = {
  children: (props: { close: () => void }) => ReactNode;
  trigger: ReactNode;
  title: string;
  description: string;
};

const AlertDialogForm = ({ children, trigger, title, description }: AlertCollectionDialogProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger className='align-center flex cursor-pointer items-center justify-center gap-2 space-x-2 rounded-xl border-2 border-gray-200 p-2 hover:bg-gray-50'>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children({ close })}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>{t('btn_cancel')}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogForm;
