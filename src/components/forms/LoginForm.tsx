import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { loginRequest } from '@/state/reducers/auth';
import { selectAuthStatus } from '@/state/selectors/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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
  const appDispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  useEffect(() => {
    if (closeDialog && authStatus === 'authenticated') {
      closeDialog();
    }
  }, [authStatus]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    appDispatch(loginRequest({ email: values.email, password: values.password }));
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
