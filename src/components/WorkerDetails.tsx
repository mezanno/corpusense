import { WorkerStatus } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import {
  // exportWorkerResultRequest,
  recoverWorkerRequest,
  removeResultRequest,
  stopWorkerProcessRequest,
} from '@/state/reducers/workers';
import { selectHasExport, selectHasResult, selectWorkerById } from '@/state/selectors/workers';
import { CircleX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from './reducers/useAlertDialogContext';
import ScopeLabel from './ScopeLabel';
import { getTaskStatusColor, getWorkerStatusIcon } from './workerUtils';

const WorkerDetails = ({ workerId }: { workerId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const worker = useAppSelector((state) => selectWorkerById(state, workerId));
  const resultExists = useAppSelector((state) =>
    worker ? selectHasExport(state, worker?.name) && selectHasResult(state, workerId) : false,
  );
  const { openSelectFormatDialog } = useDialog();
  const { openDialog } = useAlertDialogContext();

  if (worker === undefined) {
    return (
      <div className='p-4 text-center text-gray-500 italic'>{t('info_no_worker_selected')}</div>
    );
  }

  const displayRestartButton =
    worker.status === WorkerStatus.UNFINISHED ||
    worker.status === WorkerStatus.UNFINISHED_WITH_ERRORS ||
    worker.status === WorkerStatus.COMPLETED_WITH_ERRORS;

  const displayStopButton =
    worker.status === WorkerStatus.INPROGRESS ||
    worker.status === WorkerStatus.INPROGRESS_WITH_ERRORS;

  const handleRecoverWorker = () => {
    appDispatch(recoverWorkerRequest(worker));
  };

  const handleStopWorker = () => {
    appDispatch(stopWorkerProcessRequest(worker));
  };

  const handleExportResult = () => {
    openSelectFormatDialog(worker);
  };

  const handleRemoveResult = (taskId: number) => {
    openDialog({
      title: t('title_are_you_sure'),
      description: t('description_delete_worker'),
      onConfirm: {
        message: t('btn_yes'),
        action: () => appDispatch(removeResultRequest({ workerId, taskId })),
      },
    });
  };

  return (
    <div className='flex h-full w-full flex-col p-2'>
      {/* Partie haute : infos worker + boutons */}
      <div className='w-full'>
        <h2 className='text-lg font-bold'>{t('title_worker_details')}</h2>

        <ul className='my-2 w-full border-b pb-2'>
          <li>
            {t('list_title_worker_name')} : {worker.name}
          </li>
          <li className='my-2 border-b pb-2'>
            {t('list_title_worker_createdAt')} {new Date(worker.createdAt).toLocaleString()}
          </li>
          <li className='my-2 w-full border-b pb-2'>
            {t('list_title_worker_scope')} : <ScopeLabel scope={worker.scope} />
          </li>
          <li>
            {t('list_title_worker_status')} : {t(`worker_status_${worker.status}`)}
          </li>
        </ul>

        <div className='flex gap-2'>
          {displayRestartButton && (
            <button
              className='soft-button border-yellow-700 text-yellow-700'
              onClick={handleRecoverWorker}
            >
              {t('btn_recover')}
            </button>
          )}
          {displayStopButton && (
            <button className='soft-button border-red-500 text-red-500' onClick={handleStopWorker}>
              {t('btn_stop_worker')}
            </button>
          )}
          {resultExists && (
            <button
              className='soft-button border-blue-500 text-blue-500'
              onClick={handleExportResult}
            >
              {t('btn_export_result', { name: worker.name })}
            </button>
          )}
        </div>
      </div>

      {/* Partie basse : liste scrollable */}
      <div className='mt-3 min-h-0 flex-1 overflow-y-auto rounded-md p-2'>
        <h3 className='text-md mt-2 font-semibold'>
          {t('title_worker_queue')}{' '}
          <span>({t('info_worker_queue_size', { size: worker.queue.length })})</span>
        </h3>

        <ul className='p-1'>
          {worker.queue.map((task) => (
            <li
              key={task.id}
              className={`flex items-center gap-2 ${getTaskStatusColor(task.status)}`}
            >
              <span
                className={`rounded px-2 py-1 text-sm ${getTaskStatusColor(task.status)} bg-opacity-10`}
              >
                {getWorkerStatusIcon(task.status)}
              </span>
              <strong>{t('table_col_title_taskID')}</strong> {task.id} -{' '}
              <strong>{t('table_col_title_status')}</strong> {t(`worker_status_${task.status}`)}
              {task.statusMessage !== undefined && (
                <span>
                  - <em>{task.statusMessage}</em>
                </span>
              )}
              {task.status !== WorkerStatus.WAITING && (
                <CircleX
                  size={20}
                  className='cursor-pointer hover:scale-110'
                  onClick={() => handleRemoveResult(task.id)}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WorkerDetails;
