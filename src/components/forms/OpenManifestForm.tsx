import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import useAppNavigation from '@/hooks/useAppNavigation';
import i18n from '@/i18n';
import { fecthManifestRequest } from '@/state/reducers/manifests';
import { selectManifestURL } from '@/state/selectors/manifests';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import Loading from '../Loading';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '../ui/form';

const loadManifestFormSchema = z.object({
  manifestInput: z.string().nonempty({ message: i18n.t('form_error_required') }),
});

const OpenManifestForm = ({ formRef, closeDialog, setCanSubmit }: FormProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentManifestId = useAppSelector(selectManifestURL) ?? '';
  const { isLoading, loadedData, error } = useAppSelector((state) => state.manifests);
  const navigation = useAppNavigation();

  const firstTime = useRef(true); //nécessaire si on veut ouvrir le formulaire et qu'un manifest est déjà chargé

  const form = useForm<z.infer<typeof loadManifestFormSchema>>({
    resolver: zodResolver(loadManifestFormSchema),
    defaultValues: {
      manifestInput: currentManifestId,
    },
    mode: 'all',
  });

  useEffect(() => {
    setCanSubmit(!isLoading);
  }, [isLoading]);

  useEffect(() => {
    async function goToManifestExplorer() {
      await navigation.goToManifestExplorer();
    }

    if (loadedData !== null && !firstTime.current) {
      void goToManifestExplorer();
      if (closeDialog) closeDialog();
    }
  }, [loadedData]);

  if (isLoading) {
    return <Loading />;
  }

  function onSubmit(values: z.infer<typeof loadManifestFormSchema>) {
    dispatch(fecthManifestRequest(values.manifestInput));
    firstTime.current = false;
  }

  return (
    <Form {...form}>
      <div>
        <FormDescription>{t('info_drawer_description')}</FormDescription>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex w-full flex-col items-center space-y-4'
          ref={formRef}
        >
          <FormField
            control={form.control}
            name='manifestInput'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormControl>
                  <Textarea
                    {...field}
                    className='max-h-3.5 w-full resize-none'
                    placeholder={t('form_placeholder_manifest_content')}
                    onChange={field.onChange}
                    onInput={field.onChange}
                  />
                </FormControl>
                <FormMessage>{error}</FormMessage>
              </FormItem>
            )}
          />
        </form>
      </div>
    </Form>
  );
};

export default OpenManifestForm;
