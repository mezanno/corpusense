/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { clearDatabase } from '@/data/repositories/indexeddb/db';
import { useAppDispatch } from '@/hooks/hooks';
import { pushInfo } from '@/state/reducers/events';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatabaseZap } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  mistralApiKey: z.string(),
  mistralModel: z.string(),
  suryaUrl: z.string(),
});

const ConfigurationPage = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  useEffect(() => {
    // Load the saved Mistral API key from localStorage when the component mounts
    const savedApiKey = localStorage.getItem('mistralApiKey');
    if (savedApiKey !== null) {
      form.setValue('mistralApiKey', savedApiKey);
    }

    const savedModel = localStorage.getItem('mistralModel');
    if (savedModel !== null) {
      form.setValue('mistralModel', savedModel);
    }

    const savedSuryaUrl = localStorage.getItem('suryaUrl');
    if (savedSuryaUrl !== null) {
      form.setValue('suryaUrl', savedSuryaUrl);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mistralApiKey: '',
      mistralModel: 'mistral-medium-latest',
      suryaUrl: 'http://localhost:8000',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      localStorage.setItem('mistralApiKey', values.mistralApiKey);
      localStorage.setItem('mistralModel', values.mistralModel);
      localStorage.setItem('suryaUrl', values.suryaUrl);
      appDispatch(pushInfo(t('info_configuration_saved')));
    } catch (error) {
      console.error('Error saving configuration:', error);
      appDispatch(pushInfo(t('error_saving_configuration')));
    }
  }

  const onResetIndexedDB = async () => {
    await clearDatabase();
    appDispatch({ type: 'RESET_STORE' });
  };

  return (
    <section className='panel h-full flex-col'>
      <h1 className='text-xl'>{t('page_title_configuration')}</h1>
      <h2 className='mt-2'>API</h2>
      <div className='mt-2 w-1/2'>
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
            <FormField
              control={form.control}
              name='mistralModel'
              render={({ field }) => (
                <FormItem>
                  <FormLabel id='form-model'>{t('form_label_mistral_modelname')}</FormLabel>
                  <FormControl>
                    <Input {...field} aria-describedby='form-model' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='suryaUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel id='form-surya'>{t('form_label_surya')}</FormLabel>
                  <FormControl>
                    <Input {...field} aria-describedby='form-surya' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button className='soft-button' type='submit' title={t('btn_save')}>
              {t('btn_save')}
            </button>
          </form>
        </Form>
      </div>
      <h2 className='mt-2'>Indexeddb</h2>
      <div>
        <button className='soft-button' onClick={onResetIndexedDB}>
          <DatabaseZap />
          {t('btn_reset_indexeddb')}
        </button>
      </div>
    </section>
  );
};

export default ConfigurationPage;
