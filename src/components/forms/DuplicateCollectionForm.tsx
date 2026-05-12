/* eslint-disable @typescript-eslint/no-misused-promises */
import { CollectionDetails } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';

export type DuplicateCollectionFormParams = FormProps & {
  collection: CollectionDetails;
};

const DuplicateCollectionForm = ({
  formRef,
  setCanSubmit,
  collection,
}: DuplicateCollectionFormParams) => {
  const { t } = useTranslation();
  const { nameAlreadyExists, duplicateCollection } = useCollections();

  const formSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: i18n.t('form_error_required') }),
    })
    .superRefine((data, ctx) => {
      if (nameAlreadyExists(data.name)) {
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
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await duplicateCollection(collection.id, values.name);
    close();
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-name'>{t('form_label_collection_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-name' autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default DuplicateCollectionForm;
