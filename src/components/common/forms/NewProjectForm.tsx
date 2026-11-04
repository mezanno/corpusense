/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Project } from '@/data/models/project';
import useProjects from '@/hooks/data/projects/useProjects';
import useProjectsIO from '@/hooks/data/projects/useProjectsIO';
import { FormProps } from '@/hooks/ui/useDialog';
import i18n from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const NewProjectForm = ({ formRef, setCanSubmit, onResult }: FormProps<Project>) => {
  const { t } = useTranslation();
  const { projectNameAlreadyExists } = useProjects();
  const { createProject } = useProjectsIO();

  const formSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(2, { message: i18n.t('form_error_required') }),
    })
    .superRefine((data, ctx) => {
      if (projectNameAlreadyExists(data.name)) {
        ctx.addIssue({
          path: ['name'],
          code: 'custom',
          message: t('error_project_name_exists'),
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isDirty && form.formState.isValid);
  }, [form.formState.isDirty, form.formState.isValid]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const projectCreated = await createProject(values.name);
    onResult?.(projectCreated);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4' ref={formRef}>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel id='form-label'>{t('form_label_project_name')}</FormLabel>
              <FormControl>
                <Input {...field} aria-describedby='form-label' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default NewProjectForm;
