/* eslint-disable @typescript-eslint/no-misused-promises */
import { CanvasScope } from '@/data/models/Scope';
import {
  DuplicateDistribution,
  DuplicateLimit,
  useAnnotationActions,
} from '@/hooks/data/annotations/useAnnotationActions';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

type DuplicateLayoutFormProps = FormProps & {
  scope: CanvasScope;
};

const contactFormSchema = z.object({
  distribution: z.string().nonoptional(), //toutes les pages, 1 page sur 2
  limit: z.string().nonoptional(), //toute la collection, toutes les pages précédentes, toutes les pages suivantes
});

const DuplicateLayoutForm = ({ formRef, closeDialog, scope }: DuplicateLayoutFormProps) => {
  const { t } = useTranslation();
  const { duplicateRegions } = useAnnotationActions();

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      distribution: DuplicateDistribution.ALL_PAGES,
      limit: DuplicateLimit.ALL,
    },
    mode: 'onChange',
  });

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    await duplicateRegions({
      scope,
      distribution: values.distribution as DuplicateDistribution,
      limit: values.limit as DuplicateLimit,
    });

    closeDialog?.();
  }

  return (
    <Form {...form}>
      <FormDescription>{t('info_duplicate_menu')}</FormDescription>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='distribution'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_descrition_layout_distribution')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='space-y-2'
                >
                  {Object.values(DuplicateDistribution).map((option, index) => (
                    <FormItem key={index} className='flex items-center space-y-0 space-x-3'>
                      <FormControl>
                        <RadioGroupItem value={option}>
                          {/* <RadioGroupIndicator className='flex h-full w-full items-center justify-center after:h-2 after:w-2 after:rounded-full after:bg-background' /> */}
                        </RadioGroupItem>
                      </FormControl>
                      <FormLabel className='font-normal'>
                        {t(`form_option_distribution_${option}`)}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='limit'
          render={({ field }) => (
            <FormItem className='mt-4'>
              <FormLabel>{t('form_descrition_layout_limit')}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='space-y-2'
                >
                  {Object.values(DuplicateLimit).map((option, index) => (
                    <FormItem key={index} className='flex items-center space-y-0 space-x-3'>
                      <FormControl>
                        <RadioGroupItem value={option}>
                          {/* <RadioGroupIndicator className='flex h-full w-full items-center justify-center after:h-2 after:w-2 after:rounded-full after:bg-background' /> */}
                        </RadioGroupItem>
                      </FormControl>
                      <FormLabel className='font-normal'>
                        {t(`form_option_limit_${option}`)}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default DuplicateLayoutForm;
