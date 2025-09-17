/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/hooks/hooks';
import { createCollectionRequest } from '@/state/reducers/collections';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: i18next.t('form_error_required') }),
});

const NewCollectionForm = ({ close }: { close: () => void }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    dispatch(createCollectionRequest(values.name));
    close();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-label'>{t('form_label_collection_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-label' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button className='soft-button' type='submit' title={t('btn_create')}>
          {t('btn_create')}
        </button>
      </form>
    </Form>
  );
};

export default NewCollectionForm;
