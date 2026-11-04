import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SourceWithContent } from '@/data/models/source/source';
import useSources from '@/hooks/data/sources/useSources';
import { FunctionResult } from '@/utils/functionResult';
import { zodResolver } from '@hookform/resolvers/zod';
import { IIIFExternalWebResource, Manifest } from '@iiif/presentation-3';
import { Thumbnail } from '@samvera/clover-iiif/primitives';
import { Cozy } from 'cozy-iiif';
import { Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';

interface AddManifestCardProps {
  existingSource?: SourceWithContent;
  loadedManifest: Manifest | undefined;
  onResult?: (sourceId: string) => void;
  closeDialog?: () => void;
}

const AddManifestCard = ({
  existingSource,
  loadedManifest,
  onResult,
  closeDialog,
}: AddManifestCardProps) => {
  const { t } = useTranslation();
  const { addManifestToLibrary, updateSourceName } = useSources();

  const addManifestFormSchema = z
    .object({
      manifestName: z.string().min(1).optional(),
    })
    .superRefine((data, ctx) => {
      if (
        existingSource !== undefined &&
        (data.manifestName === undefined || data.manifestName.trim() === '')
      ) {
        ctx.addIssue({
          path: ['manifestName'],
          code: 'custom',
          message: t('form_error_required'),
        });
      }
    });

  const form = useForm<z.infer<typeof addManifestFormSchema>>({
    resolver: zodResolver(addManifestFormSchema),
    defaultValues: {
      manifestName: existingSource?.name,
    },
  });

  const parsedManifest = Cozy.parse(loadedManifest);

  if (parsedManifest.type !== 'manifest') {
    return <p>{t('error_invalid_manifest_input')}</p>;
  }

  const customManifestName = loadedManifest
    ? parsedManifest.resource.getSummary()
    : t('manifest_untitled', { date: new Date().toLocaleString() });

  async function onAddManifestSubmit(values: z.infer<typeof addManifestFormSchema>) {
    if (existingSource && values.manifestName !== undefined) {
      await updateSourceName(existingSource.id, values.manifestName);
    } else {
      if (parsedManifest?.type === 'manifest' && loadedManifest) {
        const name =
          values.manifestName ??
          parsedManifest.resource.getSummary() ??
          t('manifest_untitled', { date: new Date().toLocaleString() });
        const newSourceResult = await addManifestToLibrary(loadedManifest, name);
        FunctionResult.match(newSourceResult, {
          ok: (source) => {
            onResult?.(source.id);
            if (closeDialog) closeDialog();
          },
          err: (error) => {
            console.error('Error adding manifest to library: ', error);
          },
        });
      }
    }
  }

  return (
    <Card className='bg-white p-1 text-secondary-foreground'>
      {!existingSource && (
        <CardHeader className='text-center font-semibold italic'>
          {t('title_load_manifest_step_2')}
        </CardHeader>
      )}
      <CardContent className='flex items-center gap-2'>
        {loadedManifest?.thumbnail !== undefined && (
          <Thumbnail
            thumbnail={loadedManifest.thumbnail as IIIFExternalWebResource[]}
            className='max-h-40 object-fill'
          />
        )}
        <div className='flex flex-col'>
          <span className='text-sm font-bold'>{parsedManifest.resource.getSummary()}</span>
          <span className='text-xs'>{parsedManifest.resource.getLabel()}</span>
          <span className='flex items-center gap-1 text-xs'>
            <Layers size={14} />
            {parsedManifest.resource.canvases.length} pages
          </span>
        </div>
      </CardContent>
      <CardFooter className='flex flex-col'>
        <Form {...form}>
          <FormDescription>{t('form_description_manifest_rename')}</FormDescription>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={form.handleSubmit(onAddManifestSubmit)}
            className='flex w-full flex-col items-center space-y-2'
          >
            <FormField
              control={form.control}
              name='manifestName'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormControl>
                    <Input
                      {...field}
                      className='w-full'
                      placeholder={customManifestName ?? t('form_placeholder_manifest_name')}
                      onChange={field.onChange}
                      onInput={field.onChange}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='soft-button w-full' disabled={!form.formState.isValid}>
              {existingSource ? t('btn_rename') : t('btn_add_manifest_to_library')}
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
};

export default AddManifestCard;
