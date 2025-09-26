import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/hooks/hooks';
import { importCollectionRequest, importCollectionsRequest } from '@/state/reducers/collections';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { Ref } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';

const schema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ['application/json', 'application/zip'].includes(file.type),
      i18next.t('error_unsupported_file_type', { types: '.json, .zip' }),
    ),
});

const UploadFileForm = ({ formRef }: { formRef: Ref<HTMLFormElement | null> }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  function onSubmit(values: z.infer<typeof schema>) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const jsonContent = JSON.parse(content) as object;
          dispatch(importCollectionRequest(jsonContent));
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      } else if (content instanceof ArrayBuffer) {
        dispatch(importCollectionsRequest(content));
      } else {
        console.error('Unsupported file type');
      }
    };
    if (values.file.name.endsWith('.zip')) {
      reader.readAsArrayBuffer(values.file);
    } else {
      reader.readAsText(values.file);
    }
  }

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
        className='space-y-4'
      >
        <FormDescription>{t('form_description_select_collection')}</FormDescription>
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

export default UploadFileForm;
