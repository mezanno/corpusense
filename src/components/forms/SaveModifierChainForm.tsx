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
import useModifierIO from '@/hooks/data/modifiers/useModifierIO';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import i18next from 'i18next';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: i18next.t('form_error_required') }),
});

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
  const { saveModifierChain } = useModifierIO();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  // const name = form.watch('name'); //permet de redéclencher un render à chaque modif du champ name
  const formValues = useWatch({
    control: form.control,
  });
  const collectionNameExists = false; //nameAlreadyExists(name);
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

export default SaveModifierChainForm;
