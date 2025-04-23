import {
  Annotation,
  convertToElementTypeEnum,
  ElementType,
  getBodies,
} from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useExtract } from '@/hooks/useExtract';
import { useUpdateAnnotation } from '@/hooks/useSaveAnnotation';
import { fetchOcrRequest } from '@/state/reducers/workers';
import { getWorker } from '@/state/selectors/workers';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { Canvas } from '@iiif/presentation-3';
import { Copy, Save, TextSearch, TextSelect, Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const annotationFormSchema = z.object({
  type: z.nativeEnum(ElementType),
  value: z.string({ required_error: 'Type is required' }).optional(),
});

const AnnotationForm = ({
  selected,
  canvas,
  handleDelete,
}: {
  selected: {
    annotation: Annotation;
    editable?: boolean;
  }[];
  canvas: Canvas;
  handleDelete: (id: string) => void;
}) => {
  const appDispatch = useAppDispatch();
  const updateAnnotation = useUpdateAnnotation();
  const worker = useAppSelector((state) => getWorker(state, canvas.id));
  const isWorkerRunning = worker?.status === 'pending';
  const { t } = useTranslation();

  const extract = useExtract();
  const [dialogContent, setDialogContent] = React.useState<string>('');

  const form = useForm<z.infer<typeof annotationFormSchema>>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      type: convertToElementTypeEnum(selected?.[0]?.annotation?.bodies?.[0]?.value),
      value: selected?.[0]?.annotation?.bodies?.[0]?.annotation ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof annotationFormSchema>) {
    updateAnnotation(selected[0].annotation, values.type, values.value);
  }

  useEffect(() => {
    if (selected.length > 0) {
      const { type, value } = getBodies(selected[0].annotation);
      form.setValue('type', type);
      form.setValue('value', value);
    }
  }, [selected]);

  const startOcrAsync = () => {
    const rect = selected[0].annotation.target.selector.geometry;
    appDispatch(
      fetchOcrRequest({
        canvas,
        region: {
          left: rect.bounds.minX,
          top: rect.bounds.minY,
          width: rect.bounds.maxX - rect.bounds.minX,
          height: rect.bounds.maxY - rect.bounds.minY,
        },
      }),
    );
    // form.setValue('value', text);
  };

  const handleOcrClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void startOcrAsync();
  };

  const handleExtract = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const citation = await extract(selected[0].annotation);
    setDialogContent(citation);
  };

  return (
    <section className='m-2 flex-col' aria-label='annotation form'>
      <Form {...form}>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className='relative mx-auto w-full flex-col space-y-2'
        >
          <div className='flex flex-col gap-2'>
            <FormField
              control={form.control}
              name='type'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_type')}*</FormLabel>
                  <Select
                    key={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className='bg-white'>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(ElementType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='value'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_value')}</FormLabel>
                  <FormControl>
                    <Textarea
                      className='max-h-52 bg-white'
                      placeholder={t('form_placeholder_value')}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type='submit' variant='outline' className='cursor-pointer'>
            <Save /> {t('btn_save')}
          </Button>

          <div className='absolute top-0 right-0 flex justify-end space-x-2'>
            {isWorkerRunning ? (
              <div className='flex-row items-center space-x-2'>
                OCR
                {/* <Progress value={progress} className='w-[60%]' /> */}
              </div>
            ) : (
              <Button
                title={t('btn_OCR_analyze')}
                variant='secondary'
                className='cursor-pointer'
                onClick={(e) => handleOcrClick(e)}
              >
                <TextSearch />
              </Button>
            )}
            <Button
              title={t('btn_get_extract')}
              variant='secondary'
              className='cursor-pointer'
              onClick={(e) => void handleExtract(e)}
            >
              <TextSelect />
            </Button>
            <Button
              title={t('btn_delete_annotation')}
              variant='destructive'
              className='cursor-pointer'
              onClick={(event) => {
                event.preventDefault(); //pour éviter de soumettre le formulaire
                handleDelete(selected[0].annotation.id);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={dialogContent !== ''} onOpenChange={() => setDialogContent('')}>
        <DialogContent className='m-2 text-sm'>
          <DialogDescription className='flex justify-between'>
            Extrait
            <Button type='submit' variant='outline' className='cursor-pointer'>
              <span className='sr-only'>Copier</span>
              <Copy />
            </Button>
          </DialogDescription>
          <div className='flex flex-col items-end space-x-2'>
            <div>{dialogContent}</div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AnnotationForm;
