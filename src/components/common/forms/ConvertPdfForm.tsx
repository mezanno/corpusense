import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { FormProps } from '@/hooks/ui/useDialog';
import { ConvertedFileInfo, usePdfConverter } from '@/hooks/usePdfConverter';
import { FunctionResult } from '@/utils/functionResult';
import { AlertCircle, CheckCircle, Download, FileUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ConvertPdfForm = ({ closeDialog, onResult }: FormProps<string>) => {
  const { t } = useTranslation();
  const {
    fileHandle,
    fileName,
    status,
    progress,
    logs,
    selectFile,
    convert,
    addConvertedFileToLibrary,
  } = usePdfConverter();
  const [convertedFileInfo, setConvertedFileInfo] = useState<ConvertedFileInfo | null>(null);

  const handleConvert = async () => {
    const result = await convert();
    setConvertedFileInfo(result);
  };

  const handleAddToLibrary = async () => {
    if (convertedFileInfo) {
      const newSourceResult = await addConvertedFileToLibrary(convertedFileInfo);
      FunctionResult.match(newSourceResult, {
        ok: (newSource) => {
          onResult?.(newSource.id);
          closeDialog?.();
        },
        err: (error) => {
          console.error('Error adding converted file to library: ', error);
        },
      });
    }
  };

  return (
    <div className='flex flex-col space-y-2 p-2'>
      <p>{t('description_select_pdf')}</p>
      <div className='w-full items-center space-y-5'>
        {!fileHandle ? (
          <button className='soft-button w-full' onClick={() => void selectFile()}>
            <FileUp size={20} />
            {t('btn_select_pdf')}
          </button>
        ) : (
          <div className='flex w-full items-center justify-evenly space-x-2 border border-dashed bg-primary p-2'>
            <span className='flex'>
              <FileUp size={20} />
              {fileName}
            </span>
            <button
              className='soft-button'
              onClick={() => void selectFile()}
              disabled={status === 'processing'}
            >
              {t('btn_change')}
            </button>
          </div>
        )}

        {fileHandle && status !== 'done' ? (
          <button
            className='soft-button w-full'
            onClick={() => void handleConvert()}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? <Spinner className='text-cerulean-200' /> : <Download />}
            {status === 'processing' ? t('info_analysis_running') : t('btn_extract_and_generate')}
          </button>
        ) : null}

        {status === 'done' && (
          <div className='flex w-full flex-col items-center justify-center gap-2 text-green-500'>
            <span className='flex gap-2'>
              <CheckCircle />
              {t('info_done')}
            </span>
            <button className='soft-button w-full' onClick={() => void handleAddToLibrary()}>
              {t('btn_add_manifest_to_library')}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className='flex w-full justify-center gap-2 text-red-500'>
            <AlertCircle />
            {t('oups')}
          </div>
        )}
      </div>

      {(status === 'processing' || (progress > 0 && status !== 'done')) && (
        <div className='flex items-center space-x-2 border border-dashed bg-[#0c111d] p-2 text-[#94a3b8]'>
          <p>{t('info_progress', { progress: progress })}</p>
          <Progress value={progress} className='flex-1' />
        </div>
      )}

      {logs.length > 0 && status !== 'done' && (
        <div className='h-[150px] overflow-y-auto rounded-md bg-[#0c111d] p-2 font-mono text-sm text-[#94a3b8]'>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConvertPdfForm;
