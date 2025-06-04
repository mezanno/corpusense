import {
  Annotation,
  convertToElementTypeEnum,
  ElementType,
  getAnnotationText,
  getAnnotationType,
  getBodies,
} from '@/data/models/Annotation';
import { useAppDispatch } from '@/hooks/hooks';
import { useModifyAnnotation } from '@/hooks/useSaveAnnotation';
import { removeAllRegionAnnotationsRequest } from '@/state/reducers/annotations';
import { exportTextOfAnnotationRequest } from '@/state/reducers/export';
import { fetchOcrRequest } from '@/state/reducers/workers';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { Canvas } from '@iiif/presentation-3';
import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
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
  const modifyAnnotation = useModifyAnnotation();
  const { t } = useTranslation();
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
    if (selected.length > 0) {
      setEditedAnnotation(selected[0].annotation);
      const { type, value } = getBodies(selected[0].annotation);
      form.setValue('type', type);
      form.setValue('value', value);
    }
  }, [selected]);

  const startOcrAsync = () => {
    if (editedAnnotation?.collectionId !== undefined) {
      const rect = editedAnnotation.target.selector.geometry;
      appDispatch(
        fetchOcrRequest({
          canvas,
          collectionId: editedAnnotation.collectionId,
          region: {
            left: rect.bounds.minX,
            top: rect.bounds.minY,
            width: rect.bounds.maxX - rect.bounds.minX,
            height: rect.bounds.maxY - rect.bounds.minY,
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

  return (
    <section className='m-2 flex w-full' aria-label='annotation form'>
      <div className='w-1/2'>
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
      </div>
      <div className='w-1/2 flex-col'>
        <div className='w-full text-right font-light'>{selected[0].annotation.id}</div>
        <div className='flex items-center justify-end space-x-2'>
          <Toolbar
            handleOcr={startOcrAsync}
            handleExportText={handleExportText}
            handleDeleteAllAnnotations={handleRemoveAllAnnotationsInside}
            elementId={canvas.id}
          />
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
        {editedAnnotation !== null && <Entities annotation={editedAnnotation} />}
      </div>
    </section>
  );
};

export default AnnotationForm;
