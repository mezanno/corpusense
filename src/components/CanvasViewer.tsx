import {
  Annotation,
  convertToElementTypeEnum,
  ElementType,
  getBodies,
} from '@/data/models/Annotation';
import { useAppSelector } from '@/hooks/hooks';
import { useAnnotoriousStoreSync } from '@/hooks/useAnnotoriousStoreSync';
import { useOcr } from '@/hooks/useOcr';
import { useUpdateAnnotation } from '@/hooks/useSaveAnnotation';
import { getCanvasForCanvas } from '@/state/selectors/canvas';
import '@annotorious/openseadragon/annotorious-openseadragon.css';
import {
  AnnotationState,
  AnnotoriousOpenSeadragonAnnotator,
  DrawingStyleExpression,
  ImageAnnotation,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useAnnotator,
  useHover,
  useSelection,
} from '@annotorious/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Canvas, IIIFExternalWebResource, ImageService } from '@iiif/presentation-3';
import { ReactFlowProvider } from '@xyflow/react';
import { Move, Network, Save, SquarePen, TextSearch, Trash2 } from 'lucide-react';
import { TileSource } from 'openseadragon';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AnnotationsFlow from './AnnotationsFlow';
import { NothingToShow } from './NothingToShow';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Toggle } from './ui/toggle';

const colors = {
  [ElementType.TAG.toString()]: '#00ff00',
  [ElementType.ENTRY.toString()]: '#ff0000',
  [ElementType.COLUMN.toString()]: '#0000ff',
  [ElementType.LINE.toString()]: '#000000',
  [ElementType.PAGE.toString()]: '#ff00ff',
};

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
    annotation: ImageAnnotation;
    editable?: boolean;
  }[];
  canvas: Canvas;
  handleDelete: (id: string) => void;
}) => {
  const updateAnnotation = useUpdateAnnotation();
  const { computeTextWithOcr, progress, working } = useOcr();

  const form = useForm<z.infer<typeof annotationFormSchema>>({
    resolver: zodResolver(annotationFormSchema),
    defaultValues: {
      type: convertToElementTypeEnum(selected?.[0]?.annotation?.bodies?.[0]?.value),
      value: selected?.[0]?.annotation?.bodies?.[0]?.annotation ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof annotationFormSchema>) {
    console.log('onSubmit', values);

    updateAnnotation(selected[0].annotation as Annotation, values.type, values.value ?? '');
  }

  useEffect(() => {
    if (selected.length > 0) {
      const { type, value } = getBodies(selected[0].annotation as Annotation);
      form.setValue('type', type);
      form.setValue('value', value);
    }
  }, [selected]);

  const startOcrAsync = async () => {
    const rect = selected[0].annotation.target.selector.geometry;
    console.log('handleOcr', rect);

    const text = await computeTextWithOcr(canvas, {
      left: rect.bounds.minX,
      top: rect.bounds.minY,
      width: rect.bounds.maxX - rect.bounds.minX,
      height: rect.bounds.maxY - rect.bounds.minY,
    });
    form.setValue('value', text);
  };

  const handleOcrClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void startOcrAsync();
  };

  return (
    <div className='m-2 flex-col'>
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
                  <FormLabel>Type*</FormLabel>
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
                  <FormLabel>Valeur</FormLabel>
                  <FormControl>
                    <Textarea
                      className='max-h-52 bg-white'
                      placeholder='valeur'
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
            <Save /> Enregistrer
          </Button>

          <div className='absolute top-0 right-0 flex justify-end space-x-2'>
            {working ? (
              <div className='flex-row items-center space-x-2'>
                OCR
                <Progress value={progress} className='w-[60%]' />
              </div>
            ) : (
              <Button
                variant='secondary'
                className='cursor-pointer'
                onClick={(e) => handleOcrClick(e)}
              >
                <TextSearch />
              </Button>
            )}
            <Button
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
    </div>
  );
};

//we create a context to share the hovered annotation between the flow and the viewer
export const HoverContext = createContext<{ hoveredElement: string | null }>({
  hoveredElement: null,
});
export const HoverSetterContext = createContext<{
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>;
}>({ setHoveredElement: () => {} });

const CanvasViewer = () => {
  const anno = useAnnotator<AnnotoriousOpenSeadragonAnnotator>(); //useRef perd la référence lors des opérations de suppression...
  const { selected } = useSelection();

  //get the canvas to display from redux
  const canvas = useAppSelector(getCanvasForCanvas('test')) as Canvas;
  //the source of tiles for the viewer from the canvas
  const [source, setSource] = useState<TileSource[]>([]);

  const [mode, setMode] = useState<'move' | 'draw'>('move');
  const [treePanelOpen, setTreePanelOpen] = useState(false);

  // const [annotationPath, setAnnotationPath] = useState<string | null>(null);

  //Tesseract worker states
  const { computeAnnotationsWithOcr, progress, working } = useOcr();

  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const hover = useHover();

  useAnnotoriousStoreSync(anno, canvas?.id);

  useEffect(() => {
    setHoveredElement(hover?.id);
  }, [hover]);

  useEffect(() => {
    // if (canvas?.annotations?.length != null) {
    //   const annotationsPath = canvas.annotations[0]?.id;
    //   if (annotationsPath != null) {
    //     setAnnotationPath(annotationsPath);
    //   }
    // }
    if (canvas?.items?.[0]?.items?.[0]?.body != null) {
      const image = canvas.items[0].items[0].body as IIIFExternalWebResource;
      if (image?.service?.length != null) {
        const service = image.service[0] as ImageService;
        if (service !== undefined) {
          const id = service['@id'] ?? service.id;

          if (id !== undefined) {
            // const newSource = [
            //   {
            //     '@context': 'http://library.stanford.edu/iiif/image-api/1.1/context.json',
            // '@id': id
            //   .replace('https://gallica.bnf.fr/iiif', '/gallica/iiif/image/v3')
            //     '@id': id,
            //     height: image.height,
            //     width: image.width,
            //     profile: ['level2'],
            //     '@type': 'ImageService3',
            //     format: 'image/webp',
            //   } as unknown as TileSource,
            // ];
            const newSource = [`${id}/info.json`] as unknown as TileSource[];
            setSource(newSource);
          }
        }
      }
    }
  }, [canvas]);

  const handleDeleteAnnotation = (id: string) => {
    console.log('handleDeleteAnnotation ', id);
    if (anno !== undefined) {
      anno.removeAnnotation(id);
    }
  };

  const startOcrAsync = async () => {
    const annotations = await computeAnnotationsWithOcr(canvas);
    if (anno !== undefined && annotations !== undefined) {
      anno.setAnnotations(annotations);
    }
  };

  const handleOcrClick = () => {
    void startOcrAsync();
  };

  const style = (annotation: Annotation, state?: AnnotationState) => {
    const value = annotation.bodies[0]?.value ?? ElementType.TAG;
    return {
      stroke: colors[value] || '#000000',
      fill: colors[value] || '#000000',
      fillOpacity: (state?.hovered ?? false) || hoveredElement === annotation.id ? 0.3 : 0.1,
    } as DrawingStyleExpression;
  };

  const flow = useMemo(
    () => (
      <ReactFlowProvider>
        <AnnotationsFlow canvasId={canvas?.id} selectedNodeId={selected[0]?.annotation?.id} />
      </ReactFlowProvider>
    ),
    [canvas, selected],
  );

  return (
    <section className='flex h-full w-full items-center justify-center' aria-label='canvas viewer'>
      {canvas === undefined ? (
        <NothingToShow />
      ) : (
        <div className='flex h-full w-full flex-col'>
          <h4 className='w-full border-b-1 text-center text-sm italic'>{canvas?.id}</h4>
          <div className='m-1 flex h-auto w-full gap-2 space-x-2'>
            <Toggle
              pressed={treePanelOpen}
              onPressedChange={setTreePanelOpen}
              aria-label='Toggle annotation tree panel'
            >
              <Network />
            </Toggle>
            <Button onClick={handleOcrClick}>
              <TextSearch />
            </Button>
            <div className='flex items-center space-x-1 align-middle'>
              <Switch
                id='viewer-mode'
                onCheckedChange={() => setMode((prev) => (prev === 'draw' ? 'move' : 'draw'))}
              />
              <Label htmlFor='viewer-mode' className='flex items-center'>
                <span>{mode === 'draw' ? 'Mode Annotation' : 'Mode Déplacement'}</span>
                <span className='ml-1'>
                  {mode === 'draw' ? <SquarePen size={16} /> : <Move size={16} />}
                </span>
              </Label>
            </div>
          </div>
          <ResizablePanelGroup direction='horizontal' className='flex w-full grow space-x-2'>
            {treePanelOpen && (
              <>
                <ResizablePanel className='h-full w-1/2'>
                  <HoverContext.Provider value={{ hoveredElement }}>
                    <HoverSetterContext.Provider value={{ setHoveredElement }}>
                      {flow}
                    </HoverSetterContext.Provider>
                  </HoverContext.Provider>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            <ResizablePanel className='relative h-full w-1/2'>
              <OpenSeadragonAnnotator
                autoSave={true}
                drawingMode='click'
                drawingEnabled={mode === 'draw'}
                style={style}
              >
                <div className='relative h-full w-full'>
                  <OpenSeadragonViewer
                    aria-label='canvas viewer'
                    className='h-full w-full bg-amber-50'
                    options={{
                      prefixUrl: '/corpusense/images/',
                      defaultZoomLevel: 0.5,
                      minZoomLevel: 0.1,
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
                  {selected?.length > 0 && (
                    <div className='absolute bottom-0 left-0 w-full bg-amber-100'>
                      <AnnotationForm
                        canvas={canvas}
                        selected={selected}
                        handleDelete={handleDeleteAnnotation}
                      />
                    </div>
                  )}
                </div>
                {/* <OpenSeadragonAnnotationPopup
                  popup={() => (
                    <HoverCard open={selected.length > 0}>
                      <HoverCardContent>
                        <div>{selected[0]?.annotation.bodies[1]?.value}</div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  // popup={() => <AnnotationForm canvas={canvas} selected={selected} />}
                /> */}
              </OpenSeadragonAnnotator>

              {working && (
                <div className='absolute top-0 left-0 flex h-full w-full items-center justify-center'>
                  <Progress value={progress} className='w-[60%]' />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </section>
  );
};

export default CanvasViewer;
