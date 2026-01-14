import { isCollectionScope, Scope } from '@/data/models/Scope';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { startWorkerProcessRequest } from '@/state/reducers/workers';
import { selectWorkerPluginsInfo } from '@/state/selectors/workers';
import { PocketKnife, ScanText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAlertDialogContext } from '../reducers/useAlertDialogContext';
import MultiOptionsMenu from './MultiOptionsMenu';

const WorkersMenu = ({ scope }: { scope: Scope }) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const pluginsInfo = useAppSelector(selectWorkerPluginsInfo);
  const { openDialog } = useAlertDialogContext();

  const params = {
    name: 'btn_start_analysis',
    icon: <PocketKnife />,
    info: 'info_start_analysis',
    items: pluginsInfo.map((plugin) => {
      return {
        name: plugin.displayName ?? plugin.name,
        description: plugin.description,
        icon: <ScanText />,
        action: () => {
          if (plugin.batchCompatible === true && isCollectionScope(scope)) {
            openDialog({
              title: t('title_worker_scope_validation'),
              description: t('description_worker_scope_all'),
              onConfirm: {
                message: t('btn_worker_batch_yes'),
                action: () =>
                  appDispatch(
                    startWorkerProcessRequest({
                      workerName: plugin.name,
                      params: {},
                      scope,
                      batchMode: true,
                    }),
                  ),
              },
              onCancel: {
                message: t('btn_worker_batch_no'),
                action: () =>
                  appDispatch(
                    startWorkerProcessRequest({
                      workerName: plugin.name,
                      params: {},
                      scope,
                    }),
                  ),
              },
            });
          } else {
            appDispatch(
              startWorkerProcessRequest({
                workerName: plugin.name,
                params: {},
                scope,
              }),
            );
          }
        },
        category: plugin.category,
      };
    }),
  };

  return <MultiOptionsMenu params={params} scope={scope} />;
};

export default WorkersMenu;
