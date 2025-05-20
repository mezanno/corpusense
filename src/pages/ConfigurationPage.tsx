/* eslint-disable @typescript-eslint/no-misused-promises */
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  mistralApiKey: z.string(),
});

const ConfigurationPage = () => {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mistralApiKey: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    localStorage.setItem('mistralApiKey', values.mistralApiKey);
  }

  return (
    <section className='panel h-full'>
      <h1 className='text-xl'>{t('page_title_configuration')}</h1>
      <div className='mt-2 w-1/3'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
            <FormField
              control={form.control}
              name='mistralApiKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel id='form-label'>{t('form_label_mistral_api_key')}</FormLabel>
                  <FormControl>
                    <Input {...field} aria-describedby='form-label' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' title={t('btn_save')}>
              {t('btn_save')}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default ConfigurationPage;
