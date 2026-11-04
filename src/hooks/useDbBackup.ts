import { db } from '@/data/repositories/indexeddb/db';
import { useAppDispatch } from '@/hooks/hooks';
import { pushError, pushInfo } from '@/state/reducers/events';
import { exportDB, importInto } from 'dexie-export-import';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Matches both ExportProgress and ImportProgress from dexie-export-import (same shape)
interface DbOperationProgress {
  totalTables: number;
  completedTables: number;
  totalRows: number | undefined;
  completedRows: number;
  done: boolean;
}

const useDbBackup = () => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [exportProgress, setExportProgress] = useState<DbOperationProgress | null>(null);
  const [importProgress, setImportProgress] = useState<DbOperationProgress | null>(null);

  const isBusy = exportProgress !== null || importProgress !== null;

  const exportDatabase = async () => {
    try {
      const blob = await exportDB(db, {
        progressCallback: (progress: DbOperationProgress) => {
          setExportProgress(progress);
          return true;
        },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corpusense-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      appDispatch(pushInfo(t('toast_export_success')));
    } catch (error) {
      console.error('IndexedDB export failed:', error);
      appDispatch(pushError(t('toast_export_error')));
    } finally {
      setExportProgress(null);
    }
  };

  const importDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importInto(db, file, {
        clearTablesBeforeImport: true,
        overwriteValues: true,
        progressCallback: (progress: DbOperationProgress) => {
          setImportProgress(progress);
          return true;
        },
      });
      appDispatch(pushInfo(t('toast_import_success')));
      window.location.reload();
    } catch (error) {
      console.error('IndexedDB import failed:', error);
      appDispatch(pushError(t('toast_import_error')));
    } finally {
      setImportProgress(null);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const triggerImportPicker = () => {
    importInputRef.current?.click();
  };

  return {
    exportDatabase,
    importDatabase,
    triggerImportPicker,
    importInputRef,
    isBusy,
    exportProgress,
    importProgress,
  };
};

export default useDbBackup;
