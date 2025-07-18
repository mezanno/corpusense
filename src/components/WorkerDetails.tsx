import { toString } from '@/data/models/Scope';
import { WorkerStatus } from '@/data/models/Worker';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { recoverWorkerRequest } from '@/state/reducers/workers';
import { getWorkerById } from '@/state/selectors/workers';
import { useTranslation } from 'react-i18next';
import { getTaskStatusColor, getWorkerStatusIcon } from './workerUtils';

const WorkerDetails = ({ workerId }: { workerId: string }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const worker = useAppSelector((state) => getWorkerById(state, workerId));

  if (worker === undefined) {
    return (
      <div className='p-4 text-center text-gray-500 italic'>{t('info_worker__not_selected')}</div>
    );
  }

  const handleRecoverWorker = () => {
    appDispatch(recoverWorkerRequest(worker));
  };

  return (
    <div className='overflow-auto p-4'>
      <div>
        <h2 className='text-lg font-bold'>{t('title_worker_details')}</h2>
        <ul>
          <li>
            {t('list_title_worker_name')}
            {worker.name}
          </li>
          <li>
            {t('list_title_worker_createdAt')}
            {worker.createdAt}
          </li>
          <li>
            {t('list_title_worker_scope')}
            {toString(worker.scope)}
          </li>
          <li>
            {t('list_title_worker_status')}
            {worker.status}
          </li>
        </ul>
        {worker.status === WorkerStatus.UNFINISHED ||
          (worker.status === WorkerStatus.UNFINISHED_WITH_ERRORS && (
            <button
              className='soft-button border-yellow-500 text-yellow-500'
              onClick={handleRecoverWorker}
            >
              {t('btn_recover')}
            </button>
          ))}
      </div>
      <div>
        <h3 className='text-md mt-4 font-semibold'>
          {t('title_worker_queue')}{' '}
          <span>({t('info_worker_queue_size', { size: worker.queue.length })})</span>
        </h3>
        <ul>
          <li>
            <ul>
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
                  <strong>{t('table_col_title_taskID')}</strong>
                  {task.id} -<strong>{t('table_col_title_status')}</strong>
                  {task.status}
                  {task.statusMessage !== undefined && (
                    <span>
                      {' '}
                      - <em>{task.statusMessage}</em>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WorkerDetails;
