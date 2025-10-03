import { Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import DangerousMenu from './menu/DangerousMenu';
import ExportMenu from './menu/ExportMenu';
import WorkersMenu from './menu/WorkersMenu';

const Toolbar = ({
  title,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
  handleExportText,
  // getActions,
  scope,
}: {
  title?: string;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
  handleExportText?: () => void;
  handleExportResult?: (worker: Worker) => void;
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
      <ExportMenu handleExportText={handleExportText} scope={scope} />
    </div>
  );
};

export default Toolbar;
