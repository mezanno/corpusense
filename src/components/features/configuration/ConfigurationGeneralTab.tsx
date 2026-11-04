/* eslint-disable @typescript-eslint/no-misused-promises */
import { useAlertDialogContext } from '@/components/reducers/useAlertDialogContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { clearDatabase } from '@/data/repositories/indexeddb/db';
import { GITHUB_TOKEN_STORAGE_KEY } from '@/hooks/data/convertedFiles/useRepository';
import useSources from '@/hooks/data/sources/useSources';
import { useAppDispatch } from '@/hooks/hooks';
import useDbBackup from '@/hooks/useDbBackup';
import useExperimental from '@/hooks/useExperimental';
import { pushInfo } from '@/state/reducers/events';
import { DatabaseZap, Download, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const ConfigurationGeneralTab = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { experimentalFeaturesActivated, setExperimentalFeaturesActivated } = useExperimental();
  const { openDialog } = useAlertDialogContext();
  const { clearAllSources } = useSources();
  const {
    exportDatabase,
    importDatabase,
    triggerImportPicker,
    importInputRef,
    isBusy,
    exportProgress,
    importProgress,
  } = useDbBackup();

  const { register: registerGitHub, handleSubmit: handleGitHubSubmit } = useForm<{
    github_token: string;
  }>({
    defaultValues: {
      github_token: localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) ?? '',
    },
  });

  function onGitHubSubmit(values: { github_token: string }) {
    if (values.github_token.trim().length > 0) {
      localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, values.github_token.trim());
    } else {
      localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
    }
    appDispatch(pushInfo(t('toast_configuration_saved')));
  }

  const onResetIndexedDB = () => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('info_reset_indexeddb'),
      onConfirm: {
        action: async () => {
          await clearDatabase();
          appDispatch(pushInfo(t('toast_indexeddb_cleared')));
        },
        message: t('btn_yes'),
      },
    });
  };

  const onResetSources = () => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('info_reset_indexeddb'),
      onConfirm: {
        action: async () => {
          await clearAllSources();
          appDispatch(pushInfo(t('toast_indexeddb_cleared')));
        },
        message: t('btn_yes'),
      },
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setExperimentalFeaturesActivated(checked === true);
  };

  return (
    <div className='pr-4'>
      <h2 className='mt-2'>GitHub</h2>
      <div className='mt-2 w-1/2'>
        <form onSubmit={handleGitHubSubmit(onGitHubSubmit)}>
          <div className='mb-4'>
            <label htmlFor='github_token' className='mb-1 block font-medium'>
              {t('form_label_github_token')}
            </label>
            <input
              type='password'
              id='github_token'
              {...registerGitHub('github_token')}
              className='w-full rounded border border-gray-300 px-3 py-2'
            />
          </div>
          <button className='soft-button' type='submit' title={t('btn_save')}>
            {t('btn_save')}
          </button>
        </form>
      </div>

      <div className='mt-2 border border-red-500 p-1 text-red-500'>
        <div>
          <strong>{t('attention')}</strong> {t('info_experimental_features')}
        </div>
        <div className='mt-2 flex items-center gap-2'>
          <div>{t('btn_experimental_features')}</div>
          <Checkbox
            checked={experimentalFeaturesActivated}
            onCheckedChange={handleCheckboxChange}
          />
        </div>
      </div>

      <div className='mt-2 gap-2 border p-1'>
        <strong>{t('title_backup_restore')}</strong>
        <div>{t('info_backup_restore')}</div>
        <div className='mt-2 flex gap-2'>
          <button className='soft-button' onClick={exportDatabase} disabled={isBusy}>
            <Download size={16} />
            {t('btn_export_indexeddb')}
          </button>
          <button className='soft-button' onClick={triggerImportPicker} disabled={isBusy}>
            <Upload size={16} />
            {t('btn_import_indexeddb')}
          </button>
          <input
            ref={importInputRef}
            type='file'
            accept='.json'
            className='hidden'
            onChange={importDatabase}
          />
        </div>
        {exportProgress !== null && (
          <div className='mt-2'>
            <div className='mb-1 text-sm'>
              {exportProgress.done
                ? t('export_progress_done')
                : t('export_progress_status', {
                    completedRows: exportProgress.completedRows,
                    totalRows: exportProgress.totalRows,
                    completedTables: exportProgress.completedTables,
                    totalTables: exportProgress.totalTables,
                  })}
            </div>
            <Progress
              value={
                exportProgress.totalRows != null && exportProgress.totalRows > 0
                  ? (exportProgress.completedRows / exportProgress.totalRows) * 100
                  : exportProgress.totalTables > 0
                    ? (exportProgress.completedTables / exportProgress.totalTables) * 100
                    : 0
              }
            />
          </div>
        )}
        {importProgress !== null && (
          <div className='mt-2'>
            <div className='mb-1 text-sm'>
              {importProgress.done
                ? t('import_progress_done')
                : t('import_progress_status', {
                    completedRows: importProgress.completedRows,
                    totalRows: importProgress.totalRows,
                    completedTables: importProgress.completedTables,
                    totalTables: importProgress.totalTables,
                  })}
            </div>
            <Progress
              value={
                importProgress.totalRows != null && importProgress.totalRows > 0
                  ? (importProgress.completedRows / importProgress.totalRows) * 100
                  : importProgress.totalTables > 0
                    ? (importProgress.completedTables / importProgress.totalTables) * 100
                    : 0
              }
            />
          </div>
        )}
      </div>

      <div className='mt-2 gap-2 border border-red-500 p-1 text-red-500'>
        <strong className='mt-2'>Indexeddb</strong>
        <div>{t('info_reset_indexeddb')}</div>
        <div className='mt-2 flex gap-2'>
          <button className='soft-button' onClick={onResetIndexedDB}>
            <DatabaseZap />
            {t('btn_reset_indexeddb')}
          </button>
          <button className='soft-button' onClick={onResetSources}>
            <DatabaseZap />
            {t('btn_reset_sources')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationGeneralTab;
