import { useAppDispatch } from '@/hooks/hooks';
import { importModelRequest } from '@/state/reducers/models';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { Ref } from 'react';
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

const ImportModelForm = ({ formRef }: { formRef: Ref<HTMLFormElement | null> }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  function onSubmit(values: z.infer<typeof schema>) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const jsonContent = JSON.parse(content) as object;
          appDispatch(importModelRequest(jsonContent));
          console.log(jsonContent);
        } catch (err) {
          console.error('Error parsing JSON:', err);
        }
      }
    };
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
