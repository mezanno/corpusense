import LoggerPanel from '@/components/common/logger/LoggerPanel';
import ProgressPanel from '@/components/common/logger/ProgressPanel';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCollectionImporter } from '@/hooks/data/collections/useCollectionImporter';
import { FormProps } from '@/hooks/ui/useDialog';
import useProgressLogger from '@/hooks/ui/useLogger';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const schema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ['application/json', 'application/zip'].includes(file.type),
      i18n.t('error_unsupported_file_type', { types: '.json, .zip' }),
    ),
});

const ImportCollectionForm = ({ formRef, setCanSubmit }: FormProps) => {
  const { t } = useTranslation();
  const { logs, progress, setProgress, status, setStatus, addLog } = useProgressLogger();
  const { importOneCollection, importCollections } = useCollectionImporter({
    setStatus,
    setProgress,
    addLog,
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState.isDirty, form.formState.isValid, setCanSubmit]);

  function onSubmit(values: z.infer<typeof schema>) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        try {
          const json = JSON.parse(content) as object;
          await importOneCollection(values.file.name, json);
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      } else if (content instanceof ArrayBuffer) {
        await importCollections(content);
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
    <div className='flex flex-col space-y-2 p-2'>
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
                    accept='.json,.zip,application/json,application/zip'
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
      {(status === 'processing' || progress > 0) && <ProgressPanel progress={progress} />}
      {(status === 'processing' || logs.length > 0) && <LoggerPanel logs={logs} />}
    </div>
  );
};

export default ImportCollectionForm;
