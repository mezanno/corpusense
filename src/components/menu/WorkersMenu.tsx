import { workerPlugins } from '@/App';
import { Scope } from '@/data/models/Scope';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import useDialog from '@/hooks/ui/useDialog';
import { startWorkerProcessRequest } from '@/state/reducers/workers';
import { selectWorkerPluginsInfo } from '@/state/selectors/workers';
import { PocketKnife, ScanText } from 'lucide-react';
import MultiOptionsMenu from './MultiOptionsMenu';

const WorkersMenu = ({ scope }: { scope: Scope }) => {
  const appDispatch = useAppDispatch();
  const pluginsInfo = useAppSelector(selectWorkerPluginsInfo);
  const { openStartWorkerDialog } = useDialog();

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
          const workerPlugin = workerPlugins[plugin.name];
          //TODO: affiche une popup
          if (workerPlugin === undefined || workerPlugin === null) {
            console.error(`Plugin ${plugin.name} not found`);
            return;
          }

          if (workerPlugin.runtimeParametersSchema !== undefined) {
            openStartWorkerDialog(plugin.name, scope);
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
