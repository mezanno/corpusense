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
import { useCollections } from '@/hooks/data/collections/useCollections';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: i18next.t('form_error_required') }),
});

const NewCollectionForm = ({ formRef, setCanSubmit }: FormProps) => {
  const { t } = useTranslation();
  const { createCollection, nameAlreadyExists } = useCollections();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const name = form.watch('name'); //permet de redéclencher un render à chaque modif du champ name
  const collectionNameExists = nameAlreadyExists(name);
  const canSubmit = form.formState.isDirty && form.formState.isValid && !collectionNameExists;

  useEffect(() => {
    if (collectionNameExists) {
      form.setError('name', {
        type: 'manual',
        message: t('form_collection_name_already_exists'),
      });
      setCanSubmit(false);
    } else if (!form.formState.isValid) {
      form.setError('name', {
        type: 'manual',
        message: t('form_error_required'),
      });
      setCanSubmit(false);
    } else {
      form.clearErrors('name');
      setCanSubmit(form.formState.isDirty && form.formState.isValid);
    }
  }, [canSubmit]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createCollection(values.name);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4' ref={formRef}>
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

        {/* <button
          className={`${canSubmit ? 'soft-button' : 'soft-button-diabled'}`}
          type='submit'
          title={t('btn_create')}
          disabled={!canSubmit}
        >
          {t('btn_create')}
        </button> */}
      </form>
    </Form>
  );
};

export default NewCollectionForm;
