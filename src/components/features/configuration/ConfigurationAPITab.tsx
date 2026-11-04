/* eslint-disable @typescript-eslint/no-misused-promises */
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { pushInfo } from '@/state/reducers/events';
import { selectWorkerPluginsInfo } from '@/state/selectors/workers';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const ConfigurationAPITab = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const pluginsInfo = useAppSelector(selectWorkerPluginsInfo);

  const flattenedFields = useMemo(
    () =>
      pluginsInfo.reduce(
        (acc, plugin) => {
          if (plugin.configurationParams !== undefined) {
            const name = plugin.name;
            for (const [key, attributes] of Object.entries(plugin.configurationParams)) {
              const storageKey = `${name}_${key}`;
              const savedValue = localStorage.getItem(storageKey);
              acc.push({
                key: storageKey,
                description: `${plugin.displayName} : ${attributes.description}`,
                defaultValue: savedValue ?? attributes.defaultValue ?? null,
              });
            }
          }
          return acc;
        },
        [] as { key: string; description: string; defaultValue: string | null }[],
      ),
    [pluginsInfo],
  );

  const { register, reset, handleSubmit } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(
      flattenedFields.map((field) => {
        const savedValue = localStorage.getItem(field.key) ?? '';
        return [field.key, savedValue];
      }),
    ),
  });

  useEffect(() => {
    if (flattenedFields.length === 0) return;

    const defaults = Object.fromEntries(
      flattenedFields.map((field) => [field.key, field.defaultValue ?? '']),
    );

    reset(defaults);
  }, [flattenedFields, reset]);

  function onSubmit(values: Record<string, string>) {
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value.trim().length > 0) {
        localStorage.setItem(key, value);
      }
    }
    appDispatch(pushInfo(t('toast_configuration_saved')));
  }

  return (
    <div className='mt-2 w-1/2'>
      <form onSubmit={handleSubmit(onSubmit)}>
        {flattenedFields.map((field) => (
          <div key={field.key} className='mb-4'>
            <label htmlFor={field.key} className='mb-1 block font-medium'>
              {field.description}
            </label>
            <input
              type='text'
              id={field.key}
              {...register(field.key)}
              className='w-full rounded border border-gray-300 px-3 py-2'
            />
          </div>
        ))}
        <button className='soft-button' type='submit' title={t('btn_save')}>
          {t('btn_save')}
        </button>
      </form>
    </div>
  );
};

export default ConfigurationAPITab;
