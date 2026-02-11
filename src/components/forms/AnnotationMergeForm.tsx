/* eslint-disable @typescript-eslint/no-misused-promises */
import { CanvasScope } from '@/data/models/Scope';
import useAnnotationMergeAction from '@/hooks/data/annotations/useAnnotationMergeAction';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookmarkMinus } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';

const mergeFormSchema = z
  .object({
    mergeHorizontally: z.boolean(),
    mergeHorizontalThreshold: z.number().min(0).optional(),
    mergeVertically: z.boolean(),
    mergeVerticalThreshold: z.number().min(0).optional(),
    deleteSmallRegions: z.boolean(),
    sizeThreshold: z.number().min(0).optional(),
  })
  .refine((data) => !data.mergeHorizontally || data.mergeHorizontalThreshold !== undefined, {
    message: 'Le seuil horizontal est requis',
    path: ['mergeHorizontalThreshold'],
  })
  .refine((data) => !data.mergeVertically || data.mergeVerticalThreshold !== undefined, {
    message: 'Le seuil vertical est requis',
    path: ['mergeVerticalThreshold'],
  })
  .refine((data) => !data.deleteSmallRegions || data.sizeThreshold !== undefined, {
    message: 'Le seuil de taille est requis',
    path: ['sizeThreshold'],
  });

const AnnotationMergeForm = ({ scope }: { scope: CanvasScope }) => {
  const { t } = useTranslation();
  // const [liveResult, setLiveResult] = useState(true);
  const { merge, disolve, mergeAndDissolve, biggestSurface } = useAnnotationMergeAction({
    collectionId: scope.collectionId,
    canvasId: scope.canvasId,
  });

  const form = useForm<z.infer<typeof mergeFormSchema>>({
    defaultValues: {
      mergeHorizontally: false,
      mergeHorizontalThreshold: undefined,
      mergeVertically: false,
      mergeVerticalThreshold: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof mergeFormSchema>) {
    console.log(values);

    // closeDialog?.();
    if ((values.mergeVertically || values.mergeHorizontally) && values.deleteSmallRegions) {
      await mergeAndDissolve(
        values.mergeVerticalThreshold ?? 0,
        values.mergeHorizontalThreshold ?? 0,
        values.sizeThreshold ?? 0,
      );
    } else {
      if (values.mergeVertically || values.mergeHorizontally) {
        await merge(values.mergeVerticalThreshold ?? 0, values.mergeHorizontalThreshold ?? 0);
      }

      if (values.deleteSmallRegions) {
        await disolve(values.sizeThreshold ?? 0);
      }
    }
  }

  const watchMergeHorizontal = useWatch({ control: form.control, name: 'mergeHorizontally' });
  const watchMergeVertical = useWatch({ control: form.control, name: 'mergeVertically' });
  const watchDeleteSmallRegions = useWatch({ control: form.control, name: 'deleteSmallRegions' });

  return (
    <Form {...form}>
      <FormDescription>{t('info_merge_menu')}</FormDescription>
      {/* <div className='flex items-center justify-center space-x-2'>
        <Checkbox checked={liveResult} onCheckedChange={setLiveResult} />
        <span className='font-light'>{t('form_label_live_result')}</span>
      </div> */}

      <form
        // ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col items-center gap-2'
      >
        <div className='flex w-full gap-2'>
          <div className='flex w-1/3 flex-col gap-2 rounded border p-2'>
            <FormField
              control={form.control}
              name='mergeHorizontally'
              render={({ field }) => (
                <FormItem className='flex items-center'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='flex items-center'>
                    {t('form_label_merge_horizontally')}
                    <ArrowRight size={16} />
                    <ArrowLeft size={16} />
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='mergeHorizontalThreshold'
              render={({ field }) => (
                <FormItem className='flex w-full flex-col'>
                  <FormLabel
                    className={`whitespace-nowrap ${watchMergeHorizontal ? '' : 'opacity-50'}`}
                  >
                    {t('form_label_horizontal_threshold')}
                  </FormLabel>
                  <div className='flex gap-4'>
                    <FormControl className='w-1/3'>
                      <Input
                        disabled={!watchMergeHorizontal}
                        type='number'
                        {...field}
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormControl className='w-2/3'>
                      <Slider
                        disabled={!watchMergeHorizontal}
                        value={[field.value ?? 0]}
                        onValueChange={([value]) => field.onChange(value)}
                        step={1}
                        max={1000}
                        className='mx-auto w-full max-w-xs'
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className='flex w-1/3 flex-col gap-2 rounded border p-2'>
            <FormField
              control={form.control}
              name='mergeVertically'
              render={({ field }) => (
                <FormItem className='flex items-center'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='flex items-center'>
                    {t('form_label_merge_vertically')}
                    <div>
                      <ArrowDown size={16} />
                      <ArrowUp size={16} />
                    </div>
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='mergeVerticalThreshold'
              render={({ field }) => (
                <FormItem className='flex w-full flex-col'>
                  <FormLabel
                    className={`whitespace-nowrap ${watchMergeVertical ? '' : 'opacity-50'}`}
                  >
                    {t('form_label_vertical_threshold')}
                  </FormLabel>
                  <div className='flex gap-4'>
                    <FormControl className='w-1/3'>
                      <Input
                        disabled={!watchMergeVertical}
                        type='number'
                        {...field}
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormControl className='w-2/3'>
                      <Slider
                        disabled={!watchMergeVertical}
                        value={[field.value ?? 0]}
                        onValueChange={([value]) => field.onChange(value)}
                        step={1}
                        max={1000}
                        className='mx-auto w-full max-w-xs'
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className='flex w-1/3 flex-col gap-2 rounded border p-2'>
            <FormField
              control={form.control}
              name='deleteSmallRegions'
              render={({ field }) => (
                <FormItem className='flex items-center'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='flex items-center'>
                    {t('form_label_delete_small_regions')}
                    <BookmarkMinus size={16} />
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sizeThreshold'
              render={({ field }) => (
                <FormItem className='flex w-full flex-col'>
                  <FormLabel
                    className={`whitespace-nowrap ${watchDeleteSmallRegions ? '' : 'opacity-50'}`}
                  >
                    {t('form_label_size_threshold')}
                  </FormLabel>
                  <div className='flex gap-4'>
                    <FormControl className='w-1/3'>
                      <Input
                        disabled={!watchDeleteSmallRegions}
                        type='number'
                        {...field}
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormControl className='w-2/3'>
                      <Slider
                        disabled={!watchDeleteSmallRegions}
                        value={[field.value ?? 0]}
                        onValueChange={([value]) => field.onChange(value)}
                        step={1}
                        max={biggestSurface}
                        className='mx-auto w-full max-w-xs'
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type='submit' className='size-fit'>
          {t('btn_apply')}
        </Button>
      </form>
    </Form>
  );
};

export default AnnotationMergeForm;
