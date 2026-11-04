import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { Scope } from '@/data/models/scope/scope';
import { taskStatusPresentation, workerStatusPresentation } from './statusPresentation';

const WorkerStatusIcon = ({ scope }: { scope: Scope }) => {
  const status = useWorkerContext().getStatus(scope);
  if (status === undefined) {
    return null;
  }
  const presentation =
    status.kind === 'worker'
      ? workerStatusPresentation[status.status]
      : taskStatusPresentation[status.status];
  return presentation.icon;
};

export default WorkerStatusIcon;
