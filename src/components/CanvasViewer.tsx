import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import {
  AnnotationBody,
  AnnotationState,
  AnnotoriousOpenSeadragonAnnotator,
  ImageAnnotation,
  OpenSeadragonAnnotationPopup,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useSelection,
} from '@annotorious/react';
// import '@annotorious/react/annotorious-react.css';
import { Annotation, convertToElementTypeEnum, ElementType } from '@/data/models/Annotation';
import { addAnnotationRequest } from '@/state/reducers/annotations';
import { zodResolver } from '@hookform/resolvers/zod';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import { Move, SquarePen } from 'lucide-react';
import OpenSeadragon, { TileSource } from 'openseadragon';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { NothingToShow } from './NothingToShow';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import data from './annotorious.json';

const color = {
  [ElementType.TAG]: '#00ff00',
  [ElementType.ENTRY]: '#ff0000',
};

const annotationFormSchema = z.object({
  type: z.nativeEnum(ElementType),
  value: z.string({ required_error: 'Type is required' }).optional(),
});

const CanvasViewer = () => {
  const dispatch = useAppDispatch();

  const annoRef = useRef<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer>(null);
  const [mode, setMode] = useState<'move' | 'draw'>('move');
  const { selected } = useSelection();
  const canvas = useAppSelector(getCanvasForCanvas('test')) as Canvas;
  const { values: annotations, isLoading } = useAppSelector((state) => state.annotations);
  // console.log('CanvasViewer - annotations', annotations, ' | ', isLoading);

  const [source, setSource] = useState<TileSource[]>([]);
  const [annotationPath, setAnnotationPath] = useState<string | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);

  // useEffect(() => {
  //   if (canvas !== undefined) {
  //     dispatch(fetchAnnotationsByCanvasId(canvas.id));
  //   }
  // }, [canvas]);

  // useEffect(() => {
  //   if (annotations.length > 0) {
  //     annoRef.current?.setAnnotations(annotations);
  //   }
  // }, [annotations]);

  useEffect(() => {
    annoRef.current?.setAnnotations(data);
  }, [annoRef?.current]);

  const form = useForm<z.infer<typeof annotationFormSchema>>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      type: convertToElementTypeEnum(selected?.[0]?.annotation?.bodies?.[0]?.value),
      value: selected?.[0]?.annotation?.bodies?.[0]?.annotation ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof annotationFormSchema>) {
    //target.created is not serializable so we remove it to persist it (dexie) (created: undefined)
    const bodies: AnnotationBody[] = [
      {
        purpose: 'classifying',
        value: values.type,
        annotation: '',
        id: uuid(),
      },
    ];
    if (values?.value !== '') {
      bodies.push({
        purpose: 'tagging',
        value: values.value,
        annotation: '',
        id: uuid(),
      });
    }
    const annotationWithoutDate: Annotation = {
      ...selected[0].annotation,
      target: {
        ...selected[0].annotation.target,
        created: undefined,
      },
      bodies,
      canvasId: canvas.id,
    };

    dispatch(addAnnotationRequest(annotationWithoutDate));
  }

  useEffect(() => {
    if (canvas?.annotations?.length != null) {
      const annotationsPath = canvas.annotations[0]?.id;
      if (annotationsPath != null) {
        setAnnotationPath(annotationsPath);
      }
    }

    if (canvas?.items?.[0]?.items?.[0]?.body != null) {
      const image = canvas.items[0].items[0].body as IIIFExternalWebResource;
      if (image?.service?.length != null) {
        const service = image.service[0] as ImageService;
        if (service !== undefined) {
          const id = service['@id'];
          if (id !== undefined) {
            const newSource = [
              {
                '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
                // '@id': `http://localhost:3001/proxy?url=${encodeURIComponent('https://gallica.bnf.fr/iiif/ark:/12148/bpt6k14267837/f6')}`,
                // '@id': canvasImage.service[0]['@id'].replace(
                //   'https://gallica.bnf.fr/iiif',
                //   '/gallica/iiif/image/v3',
                // ),
                '@id': id.replace('https://gallica.bnf.fr/iiif', '/gallica/iiif/image/v3'),
                height: image.height,
                width: image.width,
                profile: ['http://library.stanford.edu/iiif/image-api/1.1/compliance.html#level2'],
              } as unknown as TileSource,
            ];
            setSource(newSource);
          }
        }
      }
    }
  }, [canvas]);

  useEffect(() => {
    if (annoRef?.current) {
      annoRef.current.setDrawingEnabled(mode === 'draw');
    }
  }, [mode]);

  useEffect(() => {
    if (selected?.length > 0) {
      const annotation = selected[0].annotation;
      if (annotation.bodies.length > 0) {
        const { type, value } = annotation.bodies.reduce(
          (acc, body) => {
            if (body.purpose === 'classifying') {
              acc.type = convertToElementTypeEnum(body.value);
            } else {
              acc.value = body.value ?? '';
            }
            return acc;
          },
          { type: undefined, value: '' } as { type: ElementType | undefined; value: string },
        );

        if (type !== undefined) {
          form.setValue('type', type);
        }
        form.setValue('value', value);
      }
    }
  }, [selected]);

  const style = (annotation: ImageAnnotation, state: AnnotationState) => {
    return {
      stroke: annotation.bodies[0]?.value === 'ENTRY' ? '#ff0000' : '#00ff00',
      fill: annotation.bodies[0]?.value === 'ENTRY' ? '#ff0000' : '#00ff00',
      fillOpacity: (state?.hovered ?? false) ? 0.3 : 0.1,
    };
  };

  return (
    <section className='flex h-full w-full items-center justify-center' aria-label='canvas viewer'>
      {source === null ? (
        <NothingToShow />
      ) : (
        <div className='flex h-full w-full flex-col bg-amber-500'>
          <div className='w-full grow'>
            <OpenSeadragonAnnotator
              ref={annoRef}
              drawingMode='click'
              // adapter={W3CImageFormat('https://gallica.bnf.fr/iiif/ark:/12148/bpt6k6429210k/p72')}
              style={style}
            >
              <OpenSeadragonViewer
                ref={viewerRef}
                aria-label='canvas viewer'
                className='h-full w-full bg-amber-50'
                options={{
                  prefixUrl: '/corpusense/images/',
                  defaultZoomLevel: 0.5,
                  tileSources: source,
                  loadTilesWithAjax: true,
                  crossOriginPolicy: 'Anonymous',
                  showSequenceControl: true,
                  showHomeControl: true,
                  showFullPageControl: true,
                  gestureSettingsMouse: {
                    clickToZoom: false,
                  },
                }}
              />
              <OpenSeadragonAnnotationPopup
                popup={() => <div>{selected[0]?.annotation.bodies[1]?.value}</div>}
              />
            </OpenSeadragonAnnotator>
          </div>
          <div className='min-h-80 w-full flex-col'>
            <div>
              <Button onClick={() => setMode((prev) => (prev === 'draw' ? 'move' : 'draw'))}>
                {mode === 'draw' ? <SquarePen /> : <Move />}
              </Button>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='mx-auto w-full flex-col space-y-2 p-2 md:p-5'
              >
                <div className='flex gap-2'>
                  <FormField
                    control={form.control}
                    name='type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type*</FormLabel>
                        <Select
                          key={field.value}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
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
                        <FormLabel>Valeur</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='valeur'
                            type={'text'}
                            value={field.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type='submit'>Enregistrer</Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CanvasViewer;
