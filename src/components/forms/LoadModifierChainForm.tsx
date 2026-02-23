/* eslint-disable @typescript-eslint/no-misused-promises */
import useModifierChainIO from '@/hooks/data/modifiers/useModifierChainIO';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  fromChainId: z.string(),
});

const LoadModifierChainForm = ({ formRef, setCanSubmit, closeDialog }: FormProps) => {
  const { t } = useTranslation();
  const { modifierChains, loadModifierChain } = useModifierChainIO();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await loadModifierChain(values.fromChainId);
    if (closeDialog) closeDialog();
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='fromChainId'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel id='form-fromModel'>{t('form_label_load_modifierchain')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className='w-full'>
                  <SelectTrigger>
                    <SelectValue placeholder='Choisissez un modèle' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className='w-full'>
                  {modifierChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
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

export default LoadModifierChainForm;
