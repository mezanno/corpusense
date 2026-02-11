import {
  Annotation,
  ElementType,
  getAnnotationText,
  getAnnotationType,
  getBodies,
} from '@/data/models/Annotation';
import { getDimensions } from '@/data/utils/annotations';
import { useAnnotationActions } from '@/hooks/data/annotations/useAnnotationActions';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import AnnotationOrderPanel from '../AnnotationOrderPanel';
import Entities from '../Entities';
import { useWorkerContext } from '../reducers/WorkerContext';
import Toolbar from '../ToolBar';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

const annotationFormSchema = z.object({
  type: z.enum(ElementType),
  value: z.string({ error: 'Type is required' }).optional(),
});

const AnnotationForm = ({
  annotation,
  lastOrder,
}: {
  annotation: Annotation;
  lastOrder: number;
}) => {
  const { t } = useTranslation();
  const isWorkerRunning = useWorkerContext().isWorkerOrTaskRunning({
    collectionId: annotation.collectionId,
  });
  const { updateAnnotation, removeAnnotationsByIds, removeAnnotationsInside } =
    useAnnotationActions();

  const dimensions = getDimensions(annotation);

  const form = useForm<z.infer<typeof annotationFormSchema>>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      type: getAnnotationType(annotation),
      value: getAnnotationText(annotation),
    },
  });

  async function onSubmit(values: z.infer<typeof annotationFormSchema>) {
    await updateAnnotation(annotation, values.type, values.value ?? '');
  }

  useEffect(() => {
    const { type, value } = getBodies(annotation);
    form.setValue('type', type);
    form.setValue('value', value);
  }, [annotation]);

  const handleRemoveAllAnnotationsInside = () => {
    void (async () => {
      await removeAnnotationsInside(annotation);
    })();
  };

  const handleDeleteButton: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault(); //pour éviter de soumettre le formulaire
    void (async () => {
      await removeAnnotationsByIds([annotation.id]); //we don't need to remove the annotation from annotorious (anno.removeAnnotation(id)), it will be removed automatically (when sync with the store)
    })();
  };

  return (
    <section
      className='panel h-full w-full flex-col space-y-1 shadow-[-8px_0_10px_-8px_rgba(0,0,0,0.3)]'
      aria-label='annotation form'
    >
      <div className='flex w-full flex-col text-right text-sm font-light'>
        <span>{annotation.id}</span>
        <span>
          {t('info_dimensions', {
            width: dimensions.width.toFixed(),
            height: dimensions.height.toFixed(),
          })}
        </span>
        <span>
          {t('info_surface', {
            surface: (dimensions.width * dimensions.height).toFixed(),
          })}
        </span>
      </div>

      <Separator />
      {isWorkerRunning ? (
        <div>
          <strong>{t('info_worker_running')}</strong>
        </div>
      ) : (
        <div className='flex items-center justify-end space-x-2'>
          <Toolbar
            handleDeleteAllAnnotations={handleRemoveAllAnnotationsInside}
            scope={{
              annotationId: annotation.id,
              canvasId: annotation.canvasId,
              collectionId: annotation.collectionId,
            }}
          />
          <Button
            title={t('btn_delete_annotation')}
            variant='destructive'
            className='cursor-pointer'
            onClick={handleDeleteButton}
          >
            <Trash2 />
          </Button>
        </div>
      )}
      <div className='flex items-center space-x-2 text-sm'>
        {t('form_label_order')}
        <AnnotationOrderPanel annotation={annotation} lastOrder={lastOrder} />
      </div>
      <Form {...form}>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className='m-2 mx-auto w-full flex-col space-y-2'
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
          <button type='submit' className='soft-button'>
            <Save /> {t('btn_save')}
          </button>
        </form>
      </Form>

      <Entities annotation={annotation} />
    </section>
  );
};

export default AnnotationForm;
