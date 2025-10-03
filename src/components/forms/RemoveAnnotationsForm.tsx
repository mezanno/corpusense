/* eslint-disable @typescript-eslint/no-misused-promises */
import { ElementType } from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { removeAnnotationsByScopeRequest } from '@/state/reducers/annotations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';

type RemoveAnnotationsFormProps = FormProps & {
  collectionId: string;
};

const existingTypes = Object.values(ElementType).map((type) => ({
  type,
  selected: true,
}));

const checkbox = existingTypes.reduce(
  (acc, ty) => {
    acc[ty.type] = z.boolean().optional();
    return acc;
  },
  {} as Record<string, z.ZodOptional<z.ZodBoolean>>,
);

const schema = z.object(checkbox);

const RemoveAnnotationsForm = ({ collectionId, formRef }: RemoveAnnotationsFormProps) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();

  const form = useForm<Record<string, boolean | undefined>>({
    resolver: zodResolver(schema),
    defaultValues: existingTypes.reduce((acc, type) => ({ ...acc, [type.type]: true }), {}),
    mode: 'onChange',
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (values !== undefined) {
      const types = Object.entries(values)
        .filter(([_, selected]) => selected ?? false)
        .map(([type, _]) => type as ElementType);

      appDispatch(removeAnnotationsByScopeRequest({ scope: { collectionId }, types }));
    }
  };

  return (
    <Form {...form}>
      <FormDescription>{t('description_remove_annotations')}</FormDescription>
      <form
        className='mb-4 flex flex-wrap gap-4'
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {existingTypes.map((type) => (
          <FormField
            control={form.control}
            name={type.type}
            key={type.type}
            render={({ field }) => (
              <FormItem className='flex'>
                <FormControl>
                  <Checkbox id={type.type} checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>{type.type}</FormLabel>
              </FormItem>
            )}
          />
        ))}
      </form>
    </Form>
  );
};

export default RemoveAnnotationsForm;
