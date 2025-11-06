import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { exportCollectionsRequest } from '@/state/reducers/collections';
import { selectCollectionsByIds } from '@/state/selectors/collections';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';

type ExportCollectionFormProps = FormProps & {
  collectionIds: string[];
};

const schema = z.object({
  annotations: z.boolean().optional(),
  model: z.boolean().optional(),
  workers: z.boolean().optional(),
  manifest: z.boolean().optional(),
});

const ExportCollectionForm = ({ collectionIds, formRef }: ExportCollectionFormProps) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const selectedCollections = useAppSelector((state) =>
    selectCollectionsByIds(state, collectionIds),
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      annotations: true,
      model: true,
      workers: true,
      manifest: false,
    },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    appDispatch(exportCollectionsRequest({ collectionIds, options: values }));
  }

  return (
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
                <Checkbox id='annotations' checked={field.value} onCheckedChange={field.onChange} />
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
                <Checkbox id='model' checked={field.value} onCheckedChange={field.onChange} />
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
                <Checkbox id='workers' checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>{t('form_label_include_workers')}</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='manifest'
          render={({ field }) => (
            <FormItem className='flex'>
              <FormControl>
                <Checkbox id='manifest' checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>{t('form_label_include_manifest')}</FormLabel>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default ExportCollectionForm;
