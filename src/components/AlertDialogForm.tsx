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
  trigger?: ReactNode;
  title: string;
  description: string;
  isAlertOpen?: boolean;
};

const AlertDialogForm = ({
  children,
  trigger,
  title,
  description,
  isAlertOpen,
}: AlertCollectionDialogProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(trigger === undefined ? isAlertOpen : false);

  const close = () => setIsOpen(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger !== undefined && (
        <AlertDialogTrigger title={title} className='soft-button'>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children({ close })}
        <AlertDialogFooter>
          <AlertDialogCancel className='soft-button' onClick={() => setIsOpen(false)}>
            {t('btn_cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogForm;
