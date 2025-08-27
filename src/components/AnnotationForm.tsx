import {
  Annotation,
  convertToElementTypeEnum,
  ElementType,
  getAnnotationText,
  getAnnotationType,
  getBodies,
} from '@/data/models/Annotation';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useModifyAnnotation } from '@/hooks/useSaveAnnotation';
import { removeAllRegionAnnotationsRequest } from '@/state/reducers/annotations';
import { exportTextOfAnnotationRequest } from '@/state/reducers/export';
import { startWorkerProcess } from '@/state/reducers/workers';
import { isWorkerOrTaskRunning } from '@/state/selectors/workers';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import AnnotationOrderPanel from './AnnotationOrderPanel';
import Entities from './Entities';
import Toolbar from './ToolBar';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const annotationFormSchema = z.object({
  type: z.nativeEnum(ElementType),
  value: z.string({ required_error: 'Type is required' }).optional(),
});

const AnnotationForm = ({
  annotation,
  handleDelete,
}: {
  annotation: Annotation;
  handleDelete: () => void;
}) => {
  const appDispatch = useAppDispatch();
  const modifyAnnotation = useModifyAnnotation();
  const { t } = useTranslation();
  const isWorkerRunning = useAppSelector((state) =>
    isWorkerOrTaskRunning(state, { collectionId: annotation.collectionId }),
  );
  const [editedAnnotation, setEditedAnnotation] = useState<Annotation | null>(null);

  const form = useForm<z.infer<typeof annotationFormSchema>>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      type:
        editedAnnotation !== null
          ? convertToElementTypeEnum(getAnnotationType(editedAnnotation))
          : undefined,
      value: editedAnnotation !== null ? getAnnotationText(editedAnnotation) : '',
    },
  });

  function onSubmit(values: z.infer<typeof annotationFormSchema>) {
    if (editedAnnotation !== null) {
      modifyAnnotation(editedAnnotation, values.type, values.value ?? '');
    }
  }

  useEffect(() => {
    setEditedAnnotation(annotation);
    const { type, value } = getBodies(annotation);
    form.setValue('type', type);
    form.setValue('value', value);
  }, [annotation]);

  const startOcrAsync = () => {
    if (editedAnnotation !== null) {
      const rect = editedAnnotation.target.selector.geometry;
      appDispatch(
        startWorkerProcess({
          workerName: 'peroocr',
          params: {
            region: {
              left: rect.bounds.minX,
              top: rect.bounds.minY,
              width: rect.bounds.maxX - rect.bounds.minX,
              height: rect.bounds.maxY - rect.bounds.minY,
            },
          },
          scope: {
            canvasId: annotation.canvasId,
            collectionId: annotation.collectionId,
            annotationId: annotation.id,
          },
        }),
      );
    }
  };

  const handleExportText = () => {
    if (editedAnnotation !== null) {
      appDispatch(exportTextOfAnnotationRequest(editedAnnotation));
    }
  };

  const handleRemoveAllAnnotationsInside = () => {
    if (editedAnnotation !== null) {
      appDispatch(removeAllRegionAnnotationsRequest(editedAnnotation));
    }
  };

  const handleDeleteButton: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault(); //pour éviter de soumettre le formulaire
    handleDelete();
  };

  return (
    <section className='panel m-1 w-full flex-col' aria-label='annotation form'>
      <div className='w-full text-right text-sm font-light'>{annotation.id}</div>
      {isWorkerRunning ? (
        <div>
          <strong>{t('info_worker_running')}</strong>
        </div>
      ) : (
        <div className='flex items-center justify-end space-x-2'>
          <Toolbar
            handleOcr={startOcrAsync}
            handleExportText={handleExportText}
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
        <AnnotationOrderPanel annotation={annotation} />
      </div>
      <Form {...form}>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className='relative mx-auto flex-col space-y-2'
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
        </form>
      </Form>

      {editedAnnotation !== null && <Entities annotation={editedAnnotation} />}
    </section>
  );
};

export default AnnotationForm;
