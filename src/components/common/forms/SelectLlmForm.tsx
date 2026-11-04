/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LLMProfile } from '@/data/models/LLMProfile';
import { FormProps } from '@/hooks/ui/useDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const STORAGE_KEY = 'llm-profiles';

function loadProfiles(): LLMProfile[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as LLMProfile[]) : [];
  } catch {
    return [];
  }
}

const schema = z.object({
  profileId: z.string().min(1),
});

const SelectLlmForm = ({ formRef, setCanSubmit, onResult }: FormProps<string>) => {
  const { t } = useTranslation();
  const [profiles] = useState<LLMProfile[]>(loadProfiles);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { profileId: profiles.length === 1 ? profiles[0].id : '' },
    mode: 'onChange',
  });

  useEffect(() => {
    setCanSubmit(form.formState.isValid);
  }, [form.formState.isValid, setCanSubmit]);

  function onSubmit(values: z.infer<typeof schema>) {
    onResult?.(values.profileId);
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='profileId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_select_llm_profile')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('form_placeholder_select_llm_profile')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default SelectLlmForm;
