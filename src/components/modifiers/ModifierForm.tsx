import {
  isEnumFieldMeta,
  isNumberFieldMeta,
  isStringFieldMeta,
  Modifier,
} from '@/data/models/modifiers/Modifier';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleQuestionMark } from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import z, { ZodObject, ZodRawShape } from 'zod';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type ModifierFormProps<TSchema extends ZodObject<ZodRawShape>> = {
  modifier: Modifier<TSchema>;
  initialValues: z.infer<TSchema>;
  onChange: (data: z.infer<TSchema>) => void;
};

function ModifierForm<TSchema extends ZodObject<ZodRawShape>>({
  modifier,
  onChange,
  initialValues,
}: ModifierFormProps<TSchema>) {
  const form = useForm({
    //@ts-expect-error - zodResolver is not correctly inferring the schema type from the generic, but it works at runtime
    resolver: zodResolver(modifier.schema),
    mode: 'onChange',
    defaultValues: initialValues,
  });

  const values = useWatch({
    control: form.control,
  });

  useEffect(() => {
    if (values !== undefined) {
      onChange(values as z.infer<TSchema>);
    }
  }, [values, onChange]);

  const shape = modifier.schema.shape;

  console.log('Initial values: ', initialValues);

  return (
    <div className='flex h-full w-full flex-col'>
      <FormProvider {...form}>
        <FormDescription>{modifier?.description}</FormDescription>
        <form className='mt-2 flex w-full flex-col items-center gap-2'>
          {(Object.keys(shape) as Array<keyof z.infer<TSchema>>).map((key) => {
            const meta = modifier.fieldMeta[key] ?? {};

            return (
              <FormField
                key={String(key)}
                name={String(key)}
                render={({ field }) => (
                  <FormItem className='flex h-full w-full flex-col'>
                    <div className='flex gap-1'>
                      <FormLabel className='text-xs'>{meta.label ?? String(key)}</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleQuestionMark size={20} />
                        </TooltipTrigger>
                        <TooltipContent side='top'>{meta.description}</TooltipContent>
                      </Tooltip>
                    </div>

                    {isNumberFieldMeta(meta) && (
                      <>
                        <FormControl>
                          <Input
                            type='number'
                            {...field}
                            min={0}
                            value={(field.value as number) ?? 0}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === '' ? undefined : Number(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormControl>
                          <Slider
                            value={[field.value ?? 0]}
                            onValueChange={([value]) => field.onChange(value)}
                            step={meta.step ?? 1}
                            max={meta.max ?? 100}
                          />
                        </FormControl>
                      </>
                    )}
                    {isStringFieldMeta(meta) && (
                      <FormControl>
                        <Input type='text' {...field} placeholder={meta.placeholder} />
                      </FormControl>
                    )}
                    {isEnumFieldMeta(meta) && (
                      <FormControl>
                        <select {...field} className='w-full rounded border p-1'>
                          {(meta.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                    )}
                  </FormItem>
                )}
              />
            );
          })}
        </form>
      </FormProvider>
    </div>
  );
}

export default ModifierForm;
