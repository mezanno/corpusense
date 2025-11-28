/* eslint-disable @typescript-eslint/no-misused-promises */
import { DataModel } from '@/data/models/DataModel';
import { useModels } from '@/hooks/data/models/useModels';
import { useAppSelector } from '@/hooks/hooks';
import { selectModelIdOfCollection } from '@/state/selectors/collections';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  model: z.string(),
});

const SelectModelForm = ({
  close,
  collectionId,
}: {
  close: (model: DataModel) => void;
  collectionId: string;
}) => {
  const { t } = useTranslation();
  const { models } = useModels();
  const modelIdOfCollection = useAppSelector((state) =>
    selectModelIdOfCollection(state, collectionId),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: modelIdOfCollection ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const selectedModel = models.find((model) => model.id === values.model);
    if (selectedModel) {
      close(selectedModel);
    }
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
