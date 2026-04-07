import { useModelIO } from '@/hooks/data/models/useModelIO';
import { useModels } from '@/hooks/data/models/useModels';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

const schema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ['application/json'].includes(file.type),
      i18n.t('error_unsupported_file_type', { types: '.json' }),
    ),
  overwrite: z.boolean().optional(),
});

const ImportModelForm = ({ formRef, setCanSubmit, closeDialog }: FormProps) => {
  const { t } = useTranslation();
  const { importModel } = useModelIO();

  //models and isSubmitted are used to close the dialog when the model is successfully imported
  const { models } = useModels();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { file: undefined, overwrite: false },
    mode: 'onChange',
  });

  // Close the dialog when the model is successfully imported (i.e., models list is updated)
  useEffect(() => {
    if (isSubmitted && closeDialog) {
      closeDialog();
    }
  }, [models]);

  useEffect(() => {
    setCanSubmit(form.formState.isDirty);
  }, [form.formState]);

  function onSubmit(values: z.infer<typeof schema>) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const jsonContent = JSON.parse(content) as object;
        await importModel(jsonContent, values.overwrite ?? false);
      }
    };
    setIsSubmitted(true);
    reader.readAsText(values.file);
  }

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
        className='space-y-4'
      >
        <FormDescription>{t('form_description_select_model')}</FormDescription>
        <FormField
          control={form.control}
          name='file'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type='file'
                  accept='application/json'
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    field.onChange(file);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='overwrite'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <label className='inline-flex items-center space-x-2'>
                  <Checkbox onCheckedChange={(checked) => field.onChange(checked)} />
                  <span>{t('form_label_overwrite_existing_model')}</span>
                </label>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default ImportModelForm;
