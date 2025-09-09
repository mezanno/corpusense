import { Scope } from '@/data/models/Scope';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { startWorkerProcessRequest } from '@/state/reducers/workers';
import { selectWorkerPluginsInfo } from '@/state/selectors/workers';
import { PocketKnife, ScanText } from 'lucide-react';
import MultiOptionsMenu from './MultiOptionsMenu';

const WorkersMenu = ({
  scope,
  // getActions,
}: {
  scope: Scope;
  // getActions?: (pluginName: string) => (() => void) | undefined;
}) => {
  const appDispatch = useAppDispatch();
  const pluginsInfo = useAppSelector(selectWorkerPluginsInfo);

  const params = {
    name: 'btn_start_analysis',
    icon: <PocketKnife />,
    info: 'info_start_analysis',
    items: pluginsInfo.map((plugin) => {
      // const action = getActions
      //   ? getActions(plugin.name)
      //   : () => {
      //       appDispatch(
      //         startWorkerProcess({
      //           workerName: plugin.name,
      //           params: {},
      //           scope,
      //         }),
      //       );
      //     };
      return {
        name: plugin.displayName ?? plugin.name,
        description: plugin.description,
        icon: <ScanText />,
        action: () => {
          appDispatch(
            startWorkerProcessRequest({
              workerName: plugin.name,
              params: {},
              scope,
            }),
          );
        },
      };
    }),
  };

  return <MultiOptionsMenu params={params} scope={scope} />;
};

export default WorkersMenu;
