import { workerPlugins } from '@/App';
import { Scope } from '@/data/models/Scope';
import { useAppDispatch } from '@/hooks/hooks';
import { FormProps } from '@/hooks/ui/useDialog';
import { startWorkerProcessRequest } from '@/state/reducers/workers';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';
import { Checkbox } from '../ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';

type StartWorkerFormProps = FormProps & {
  workerName: string;
  scope: Scope;
};

const StartWorkerForm = ({ workerName, scope, formRef }: StartWorkerFormProps) => {
  const appDispatch = useAppDispatch();

  const plugin = workerPlugins[workerName];
  const paramSchema = plugin.runtimeParametersSchema! as z.ZodObject;

  const shape = paramSchema.shape as Record<string, z.ZodTypeAny>;

  const defaultValues: Partial<z.infer<typeof paramSchema>> = {};

  Object.entries(shape).forEach(([key, fieldShape]) => {
    if (fieldShape instanceof z.ZodEnum) {
      // la première option devient la valeur par défaut
      defaultValues[key] = fieldShape.options[0];
    }
  });

  const form = useForm<z.infer<typeof paramSchema>>({
    resolver: zodResolver(paramSchema),
    defaultValues,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (fieldShape: z.ZodTypeAny, field: any) => {
    if (fieldShape instanceof z.ZodEnum) {
      return (
        <select {...field}>
          {fieldShape.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (fieldShape instanceof z.ZodString) {
      return (
        <FormControl>
          <Input type='text' {...field} />
        </FormControl>
      );
    }

    if (fieldShape instanceof z.ZodNumber) {
      return (
        <FormControl>
          <input type='number' {...field} />
        </FormControl>
      );
    }

    if (fieldShape instanceof z.ZodBoolean) {
      return (
        <FormControl>
          <Checkbox {...field} />
        </FormControl>
      );
    }

    return <div>Unsupported field type</div>;
  };

  const onSubmit = (data: z.infer<typeof paramSchema>) => {
    appDispatch(
      startWorkerProcessRequest({
        workerName,
        params: data,
        scope,
      }),
    );
  };

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col space-y-2'
      >
        {Object.entries(shape).map(([key, fieldShape]) => (
          <FormField
            key={key}
            name={key}
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fieldShape.description}</FormLabel>
                {renderField(fieldShape, field)}
              </FormItem>
            )}
          />
        ))}
      </form>
    </FormProvider>
  );
};

export default StartWorkerForm;
