/* eslint-disable @typescript-eslint/no-misused-promises */
import { useAppDispatch } from '@/hooks/hooks';
import { createModelRequest } from '@/state/reducers/models';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const NewModelForm = ({ close }: { close: () => void }) => {
  const appDispatch = useAppDispatch();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('values', values);

    appDispatch(createModelRequest({ name: values.name, description: values.description }));
    close();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-name'>{t('form_label_model_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-name' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-description'>{t('form_label_model_description')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-description' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' title={t('btn_create')}>
          {t('btn_create')}
        </Button>
      </form>
    </Form>
  );
};

export default NewModelForm;
