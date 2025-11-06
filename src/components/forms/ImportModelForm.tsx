import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { importModelRequest } from '@/state/reducers/models';
import { selectModels } from '@/state/selectors/models';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

const schema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ['application/json'].includes(file.type),
      i18next.t('error_unsupported_file_type', { types: '.json' }),
    ),
});

const ImportModelForm = ({ formRef, setCanSubmit, closeDialog }: FormProps) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  //models and isSubmitted are used to close the dialog when the model is successfully imported
  const models = useAppSelector(selectModels);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { file: undefined },
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
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const jsonContent = JSON.parse(content) as object;
        appDispatch(importModelRequest(jsonContent));
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
      </form>
    </Form>
  );
};

export default ImportModelForm;
