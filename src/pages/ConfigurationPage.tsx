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
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch } from '@/hooks/hooks';
import { pushInfo } from '@/state/reducers/events';
import { DEFAULT_PROMPT } from '@/state/sagas/plugins/workers/mistral';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  mistralApiKey: z.string(),
  prompt: z.string(),
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

    const savedPrompt = localStorage.getItem('prompt');
    if (savedPrompt !== null) {
      form.setValue('prompt', savedPrompt);
    } else {
      form.setValue('prompt', DEFAULT_PROMPT);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mistralApiKey: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      localStorage.setItem('mistralApiKey', values.mistralApiKey);
      localStorage.setItem('prompt', values.prompt);
      appDispatch(pushInfo(t('info_configuration_saved')));
    } catch (error) {
      console.error('Error saving configuration:', error);
      appDispatch(pushInfo(t('error_saving_configuration')));
    }
  }

  return (
    <section className='panel h-full'>
      <h1 className='text-xl'>{t('page_title_configuration')}</h1>
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
              name='prompt'
              render={({ field }) => (
                <FormItem>
                  <FormLabel id='form-prompt'>{t('form_label_prompt_mistral')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} aria-describedby='form-prompt' />
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
