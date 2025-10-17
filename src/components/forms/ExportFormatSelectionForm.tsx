/* eslint-disable @typescript-eslint/no-misused-promises */
import { Worker } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { exportWorkerResultRequest } from '@/state/reducers/workers';
import { selectExportFormats } from '@/state/selectors/workers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Checkbox } from '../ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';

type ExportFormatSelectionFormProps = FormProps & {
  worker: Worker;
};

const ExportFormatSelectionForm = ({
  worker,
  formRef,
  setCanSubmit,
}: ExportFormatSelectionFormProps) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const formats = useAppSelector((state) => selectExportFormats(state, worker.name));

  const checkbox = formats.reduce(
    (acc, f) => {
      acc[f] = z.boolean().optional();
      return acc;
    },
    {} as Record<string, z.ZodOptional<z.ZodBoolean>>,
  );

  const schema = z.object(checkbox).refine((data) => Object.values(data).some(Boolean), {
    message: t('error_no_export_format_selected'),
  });

  const form = useForm<Record<string, boolean | undefined>>({
    resolver: zodResolver(schema),
    //if only one format is available, select it by default, otherwise, none is selected
    defaultValues: formats.reduce(
      (acc, f) => {
        acc[f] = formats.length === 1 ? true : false;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    const selectedFormats = Object.entries(values)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
    appDispatch(exportWorkerResultRequest({ worker, formats: selectedFormats }));
  };

  return (
    <Form {...form}>
      <FormDescription> {t('description_select_export_formats')}</FormDescription>
      <form
        className='flex flex-col items-center space-y-2'
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
      >
        {formats.map((format) => (
          <FormField
            control={form.control}
            name={format}
            key={format}
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox id={format} checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{format}</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </form>
    </Form>
  );
};

export default ExportFormatSelectionForm;
