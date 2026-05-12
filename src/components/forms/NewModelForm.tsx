/* eslint-disable @typescript-eslint/no-misused-promises */
import { useModels } from '@/hooks/data/models/useModels';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const NewModelForm = ({ formRef, setCanSubmit }: FormProps) => {
  const { t } = useTranslation();
  const { models, createModel, nameAlreadyExists } = useModels();

  const formSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: i18n.t('form_error_required') }),
      description: z.string().optional(),
      fromModelId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (nameAlreadyExists(data.name)) {
        ctx.addIssue({
          path: ['name'],
          code: 'custom',
          message: t('form_model_name_already_exists'),
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createModel({
      name: values.name,
      description: values.description,
      fromModelId: values.fromModelId,
    });
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
              <FormLabel id='form-name'>{t('form_label_model_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-name' autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-description'>{t('form_label_model_description')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-description' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='fromModelId'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel id='form-fromModel'>{t('form_label_model_from_model')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className='w-full'>
                  <SelectTrigger>
                    <SelectValue placeholder='Choisissez un modèle' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='w-full'>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default NewModelForm;
