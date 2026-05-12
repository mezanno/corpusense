import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useConnectedUserContext } from '../reducers/ConnectedUserContext';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

const formSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const LoginForm = ({ formRef, setCanSubmit, closeDialog }: FormProps) => {
  const { t } = useTranslation();
  const { status, login } = useConnectedUserContext();
  const newlyOpened = useRef(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  useEffect(() => {
    if (!newlyOpened.current && closeDialog && status === 'authenticated') {
      closeDialog();
    }
  }, [status]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await login(values.email, values.password);
    newlyOpened.current = false;
  }

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
        className='space-y-4'
      >
        <FormDescription>{t('description_login')}</FormDescription>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_email')}</FormLabel>
              <FormControl>
                <Input placeholder='votreadresse@email.fr' type='email' {...field} />
              </FormControl>
              <FormDescription>{t('form_descrition_email')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_password')}</FormLabel>
              <FormControl>
                <Input placeholder='mot de passe' {...field} type='password' />
              </FormControl>
              <FormDescription>{t('form_description_password')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default LoginForm;
