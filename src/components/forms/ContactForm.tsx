/* eslint-disable @typescript-eslint/no-misused-promises */
import { FormProps } from '@/hooks/ui/useDialog';
import emailjs from '@emailjs/browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const contactFormSchema = z.object({
  nom: z.string(),
  email: z.email(),
  object: z.string().min(3, 'Object must be at least 3 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

const ContactForm = ({ formRef, setCanSubmit, closeDialog }: FormProps) => {
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

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
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
        if (closeDialog) {
          closeDialog();
        }
      }, 2000);
    } catch (err) {
      setError(t('error_email_sending'));
      return;
    }
  }

  return (
    <Form {...form}>
      <FormDescription className='mb-2'>{t('info_contact_drawer_description')}</FormDescription>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col items-center space-y-4'
        ref={formRef}
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
        {showFireworks && <Fireworks autorun={{ speed: 2, duration: 4 }} />}
      </form>
    </Form>
  );
};

export default ContactForm;
