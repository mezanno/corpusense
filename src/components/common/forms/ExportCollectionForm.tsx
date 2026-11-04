import LoggerPanel from '@/components/common/logger/LoggerPanel';
import ProgressPanel from '@/components/common/logger/ProgressPanel';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCollectionIO } from '@/hooks/data/collections/useCollectionIO';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { FormProps } from '@/hooks/ui/useDialog';
import useProgressLogger from '@/hooks/ui/useLogger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';

type ExportCollectionFormProps = FormProps & {
  collectionIds: string[];
};

const schema = z.object({
  annotations: z.boolean().optional(),
  model: z.boolean().optional(),
  workers: z.boolean().optional(),
  workersScope: z.enum(['collection', 'all']).optional(),
  manifest: z.boolean().optional(),
});

const ExportCollectionForm = ({ collectionIds, formRef }: ExportCollectionFormProps) => {
  const { t } = useTranslation();
  const { logs, progress, setProgress, status, setStatus, addLog } = useProgressLogger();
  const { exportCollections } = useCollectionIO({
    setStatus,
    setProgress,
    addLog,
  });

  const { collections } = useCollections();
  const selectedCollections = collections.filter((c) => collectionIds.includes(c.id));

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      annotations: true,
      model: true,
      workers: true,
      workersScope: 'collection',
      manifest: false,
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    await exportCollections(collectionIds, values);
  }

  const workersChecked = useWatch({ control: form.control, name: 'workers' });

  return (
    <div className='flex flex-col space-y-2 p-2'>
      <Form {...form}>
        <form
          className='space-y-2'
          ref={formRef}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormDescription>
            {t('form_description_export_collection', {
              names: selectedCollections.map((c) => c.name),
            })}
          </FormDescription>
          <FormField
            control={form.control}
            name='annotations'
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t('form_label_include_annotations')}</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='model'
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t('form_label_include_model')}</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='workers'
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t('form_label_include_workers')}</FormLabel>
              </FormItem>
            )}
          />
          {workersChecked === true && (
            <FormField
              control={form.control}
              name='workersScope'
              render={({ field }) => (
                <FormItem className='ml-6'>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className='flex gap-4'
                    >
                      <FormItem className='flex items-center gap-2'>
                        <FormControl>
                          <RadioGroupItem value='collection' id='workers-scope-collection' />
                        </FormControl>
                        <FormLabel htmlFor='workers-scope-collection'>
                          {t('form_label_workers_scope_collection')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center gap-2'>
                        <FormControl>
                          <RadioGroupItem value='all' id='workers-scope-all' />
                        </FormControl>
                        <FormLabel htmlFor='workers-scope-all'>
                          {t('form_label_workers_scope_all')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name='manifest'
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{t('form_label_include_manifest')}</FormLabel>
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

export default ExportCollectionForm;
