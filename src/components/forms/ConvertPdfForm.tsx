import { usePdfConverter } from '@/hooks/usePdfConverter';
import { AlertCircle, CheckCircle, Download, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';

const ConvertPdfForm = () => {
  const { t } = useTranslation();
  const { fileHandle, fileName, status, progress, logs, selectFile, convert } = usePdfConverter();

  return (
    <div className='flex flex-col space-y-2 p-2'>
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
            onClick={() => void convert()}
            disabled={status === 'processing'}
          >
            {status === 'processing' ? <Spinner className='text-cerulean-200' /> : <Download />}
            {status === 'processing' ? t('info_analysis_running') : t('btn_extract_and_generate')}
          </button>
        ) : null}

        {status === 'done' && (
          <div className='flex w-full justify-center gap-2 text-green-500'>
            <CheckCircle />
            {t('info_done')}
          </div>
        )}

        {status === 'error' && (
          <div className='flex w-full justify-center gap-2 text-red-500'>
            <AlertCircle />
            {t('oups')}
          </div>
        )}
      </div>

      {(status === 'processing' || progress > 0) && (
        <div className='flex items-center space-x-2 border border-dashed bg-[#0c111d] p-2 text-[#94a3b8]'>
          <p>{t('info_progress', { progress: progress })}</p>
          <Progress value={progress} className='flex-1' />
        </div>
      )}

      {logs.length > 0 && (
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
