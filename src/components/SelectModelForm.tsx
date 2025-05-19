/* eslint-disable @typescript-eslint/no-misused-promises */
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setActiveModel } from '@/state/reducers/models';
import { getModels } from '@/state/selectors/models';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  model: z.string(),
});

const SelectModelForm = ({ close }: { close: () => void }) => {
  const appDispatch = useAppDispatch();
  const { t } = useTranslation();
  const models = useAppSelector(getModels);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // defaultValues: {
    //   model: '',
    // },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    appDispatch(setActiveModel(values.model));
    close();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='model'
          render={({ field }) => (
            <FormItem className='min-w-1/2'>
              <FormLabel id='form-description'>{t('form_label_model_name')}</FormLabel>
              <Select key={field.value} onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className='w-full bg-white'>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form_description_select_model')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
        <Button type='submit' title={t('btn_choose')}>
          {t('btn_choose')}
        </Button>
      </form>
    </Form>
  );
};

export default SelectModelForm;
