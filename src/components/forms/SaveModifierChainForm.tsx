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
import { AnyModifier } from '@/data/models/modifiers/Modifier';
import useModifierChainIO from '@/hooks/data/modifiers/useModifierChainIO';
import useModifierChainLive from '@/hooks/data/modifiers/useModifierChainLive';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export type SaveModifierChainFormParams = {
  modifiers: AnyModifier[];
  modifiersValues: Record<string, unknown>;
};

type SaveModifierChainFormProps = FormProps & SaveModifierChainFormParams;

const SaveModifierChainForm = ({
  formRef,
  setCanSubmit,
  modifiers,
  modifiersValues,
}: SaveModifierChainFormProps) => {
  const { t } = useTranslation();
  const { saveModifierChain } = useModifierChainIO();
  const { nameAlreadyExists } = useModifierChainLive();

  const formSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: i18n.t('form_error_required_and_min', { min: 2 }) })
      .refine((name) => !nameAlreadyExists(name), {
        message: i18n.t('form_collection_modifierchain_already_exists'),
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const formValues = useWatch({
    control: form.control,
  });
  const chainNameExists =
    formValues.name !== undefined ? nameAlreadyExists(formValues.name) : false;
  const canSubmit = form.formState.isDirty && form.formState.isValid && !chainNameExists;

  useEffect(() => {
    if (chainNameExists) {
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
    await saveModifierChain(values.name, modifiers, modifiersValues);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4' ref={formRef}>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-label'>{t('form_label_modifierchain_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-label' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default SaveModifierChainForm;
