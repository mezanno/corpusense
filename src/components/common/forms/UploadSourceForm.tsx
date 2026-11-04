/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import useRepository from '@/hooks/data/convertedFiles/useRepository';
import useSource from '@/hooks/data/sources/useSource';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export type UploadSourceFormParams = {
  sourceId: string;
};

type UploadSourceFormProps = FormProps & UploadSourceFormParams;

const UploadSourceForm = ({ formRef, setCanSubmit, sourceId }: UploadSourceFormProps) => {
  const { t } = useTranslation();
  const { uploadToRepository, nameAlreadyExists, logs, status, progress } = useRepository();
  const { sourceWithContent } = useSource(sourceId);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const formSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(2, { message: i18n.t('form_error_required') }),
    })
    .superRefine(async (data, ctx) => {
      if (await nameAlreadyExists(data.name)) {
        ctx.addIssue({
          path: ['name'],
          code: 'custom',
          message: t('form_collection_name_already_exists'),
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(
      form.formState.isDirty &&
        form.formState.isValid &&
        !form.formState.isValidating &&
        status !== 'processing',
    );
  }, [form.formState.isDirty, form.formState.isValid, form.formState.isValidating, status]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (sourceWithContent === undefined) return;
    await uploadToRepository(sourceWithContent, values.name);
  }

  return (
    <Form {...form}>
      <FormDescription>Vous allez mettre en ligne {sourceWithContent?.name}</FormDescription>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4' ref={formRef}>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-label'>{t('form_label_repository_name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  aria-describedby='form-label'
                  autoFocus
                  disabled={status === 'processing'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>

      {(status === 'processing' || progress > 0) && (
        <div className='mt-2 flex items-center space-x-2 border border-dashed bg-[#0c111d] p-2 text-[#94a3b8]'>
          <p>{t('info_progress', { progress: progress })}</p>
          <Progress value={progress} className='flex-1' />
        </div>
      )}

      {status === 'done' && (
        <div className='mt-2 flex w-full justify-center gap-2 text-green-500'>
          <CheckCircle />
          {t('info_done')}
        </div>
      )}

      {status === 'error' && (
        <div className='mt-2 flex w-full justify-center gap-2 text-red-500'>
          <AlertCircle />
          {t('oups')}
        </div>
      )}

      {logs.length > 0 && (
        <div className='mt-2 h-[150px] overflow-y-auto rounded-md bg-[#0c111d] p-2 font-mono text-sm text-[#94a3b8]'>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </Form>
  );
};

export default UploadSourceForm;
