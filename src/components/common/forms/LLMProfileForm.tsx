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
import { LLMProfile } from '@/data/models/LLMProfile';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const llmProfileSchema = z.object({
  name: z.string().trim().min(1),
  baseUrl: z.string().trim().min(1),
  apiKey: z.string(),
  model: z.string().trim().min(1),
});

export type LLMProfileFormValues = z.infer<typeof llmProfileSchema>;

interface LLMProfileFormProps extends FormProps<LLMProfileFormValues> {
  defaultValues?: Partial<LLMProfile>;
}

const LLMProfileForm = ({
  formRef,
  setCanSubmit,
  onResult,
  defaultValues,
}: LLMProfileFormProps) => {
  const { t } = useTranslation();

  const form = useForm<LLMProfileFormValues>({
    resolver: zodResolver(llmProfileSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      baseUrl: defaultValues?.baseUrl ?? '',
      apiKey: defaultValues?.apiKey ?? '',
      model: defaultValues?.model ?? '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isValid);
  }, [form.formState.isValid, setCanSubmit]);

  function onSubmit(values: LLMProfileFormValues) {
    onResult?.(values);
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_llm_profile_name')}</FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='baseUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_llm_profile_base_url')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='apiKey'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_llm_profile_api_key')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='model'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_llm_profile_model')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default LLMProfileForm;
