import WorkersMenu from '@/components/features/workers/WorkersMenu';
import { Scope } from '@/data/models/scope/scope';
import DangerousMenu from './menu/DangerousMenu';

const Toolbar = ({
  title,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
  // getActions,
  scope,
}: {
  title?: string;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
  // getActions?: (pluginName: string) => (() => void) | undefined;
  scope: Scope;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <WorkersMenu scope={scope} />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={scope}
      />
    </div>
  );
};

export default Toolbar;
