/* eslint-disable @typescript-eslint/no-misused-promises */
import { useAppDispatch } from '@/hooks/hooks';
import { resetManifestOpenEvent } from '@/state/reducers/manifests';
import emailjs from '@emailjs/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface handleCloseProps {
  handleClose: () => void;
}

const contactFormSchema = z.object({
  nom: z.string(),
  email: z.string().email(),
  object: z.string().min(3, 'Object must be at least 3 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

const ContactForm = ({ handleClose }: handleCloseProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | undefined>(undefined);
  const [showFireworks, setShowFireworks] = useState(false);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nom: '',
      email: '',
      object: '',
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    // dispatch(fecthManifestRequest(values.manifestInput));
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID as string,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string,
        {
          nom: values.nom,
          email: values.email,
          object: values.object,
          message: values.message,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string,
      );
      setShowFireworks(true);
      setTimeout(() => {
        setShowFireworks(false);
        handleClose();
      }, 2000);
    } catch (err) {
      setError(t('error_email_sending'));
      return;
    }
  }

  return (
    <div className='grid w-1/2 gap-2'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex w-full flex-col items-center space-y-4'
        >
          <FormField
            control={form.control}
            name='nom'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Input {...field} placeholder={t('form_placeholder_contact_name')} />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Input {...field} placeholder={t('form_placeholder_contact_email')} />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='object'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Input {...field} placeholder={t('form_placeholder_contact_object')} />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='message'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Textarea
                    {...field}
                    className='max-h-4.5 w-full resize-none'
                    placeholder={t('form_placeholder_contact_message')}
                  />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
          <button className='soft-button' type='submit'>
            {t('btn_send')}
          </button>
          {showFireworks && <Fireworks autorun={{ speed: 2, duration: 4 }} />}
        </form>
      </Form>
    </div>
  );
};

const ContactDrawer = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      appDispatch(resetManifestOpenEvent());
    }
  }, [isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button className='soft-button' aria-label={t('btn_open_contact')}>
          <Mail size={16} />
          {t('btn_open_contact')}
        </button>
      </DrawerTrigger>
      <DrawerContent className='max-h-[33vh] w-full items-center bg-white'>
        <DrawerHeader>
          <DrawerTitle>{t('title_contact')}</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription className='mb-2 max-w-1/2'>
          {t('info_contact_drawer_description')}
        </DrawerDescription>
        <ContactForm handleClose={() => setIsOpen(false)} />
        <DrawerFooter>
          <DrawerClose>
            <div className='soft-button'>{t('btn_cancel')}</div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
export default ContactDrawer;
