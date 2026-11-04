import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import useSources from '@/hooks/data/sources/useSources';
import i18n from '@/i18n';
import { FunctionResult } from '@/utils/functionResult';
import { containsArkIdentifier, isManifestUrl } from '@/utils/manifest';
import { getErrorMessage } from '@/utils/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Manifest } from '@iiif/presentation-3';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

interface LoadManifestCardProps {
  setLoadedManifest: (manifest: Manifest | undefined) => void;
  errorDisplayed: string;
  setErrorDisplayed: (error: string) => void;
}

const LoadManifestCard = ({
  setLoadedManifest,
  errorDisplayed,
  setErrorDisplayed,
}: LoadManifestCardProps) => {
  const { t } = useTranslation();
  const { fetchManifest } = useSources();

  const loadManifestFormSchema = z
    .object({
      manifestInput: z.string().nonempty({ message: i18n.t('form_error_required') }),
    })
    .superRefine((data, ctx) => {
      if (!isManifestUrl(data.manifestInput) && !containsArkIdentifier(data.manifestInput)) {
        ctx.addIssue({
          path: ['manifestInput'],
          code: 'custom',
          message: i18n.t('error_invalid_manifest_input'),
        });
      }
    });

  const form = useForm<z.infer<typeof loadManifestFormSchema>>({
    resolver: zodResolver(loadManifestFormSchema),
    mode: 'all',
  });

  async function onLoadManifestSubmit(values: z.infer<typeof loadManifestFormSchema>) {
    setLoadedManifest(undefined);
    setErrorDisplayed('');

    console.log('onLoadManifestSubmit ', values.manifestInput);

    const newManifestResult = await fetchManifest(values.manifestInput);
    FunctionResult.match(newManifestResult, {
      ok: (newManifest) => {
        setLoadedManifest(newManifest);
      },
      err: (error) => {
        setErrorDisplayed(getErrorMessage(error));
      },
    });
  }

  return (
    <Card className='bg-white p-1 text-secondary-foreground'>
      <CardHeader className='text-center font-semibold italic'>
        {t('title_load_manifest_step_1')}
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-2'>
        <span className='text-left text-sm font-light not-italic'>
          {t('info_drawer_description')}
        </span>
        <Form {...form}>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={form.handleSubmit(onLoadManifestSubmit)}
            className='flex w-full flex-col items-center space-y-2'
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
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage>{errorDisplayed}</FormMessage>
                </FormItem>
              )}
            />
            <Button type='submit' className='soft-button w-full' disabled={!form.formState.isValid}>
              {t('btn_open_manifest')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoadManifestCard;
