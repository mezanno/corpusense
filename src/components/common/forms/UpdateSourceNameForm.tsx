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
import { Source } from '@/data/models/source/source';
import useSources from '@/hooks/data/sources/useSources';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

type UpdateSourceNameFormProps = FormProps<void> & {
  source: Source;
  onResult: (result: void) => void;
};

const UpdateSourceNameForm = ({
  formRef,
  setCanSubmit,
  closeDialog,
  source,
  onResult,
}: UpdateSourceNameFormProps) => {
  const { t } = useTranslation();
  const { updateSourceName } = useSources();

  const formSchema = z.object({
    sourceName: z.string().min(1, { message: t('form_error_required') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceName: source.name,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await updateSourceName(source.id, values.sourceName);
    closeDialog?.();
    onResult();
  }

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
        className='space-y-4'
      >
        <FormDescription>{t('form_description_source_rename')}</FormDescription>
        <FormField
          control={form.control}
          name='sourceName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_sourcename')}</FormLabel>
              <FormControl>
                <Input type='text' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default UpdateSourceNameForm;
