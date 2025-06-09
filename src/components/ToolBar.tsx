import { Worker, WorkerScope } from '@/data/models/Worker';
import AnalysisMenu from './menu/AnalysisMenu';
import DangerousMenu from './menu/DangerousMenu';
import ExportMenu from './menu/ExportMenu';

const Toolbar = ({
  title,
  handleLayout,
  handleOcr,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
  handleExportText,
  handleExtractData,
  handleExportResult,
  elementId,
  scope,
}: {
  title?: string;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
  handleExportText?: () => void;
  handleExtractData?: () => void;
  handleExportResult?: (worker: Worker) => void;
  elementId: string;
  scope: WorkerScope;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleExtractData={handleExtractData}
        elementId={elementId}
        scope={scope}
      />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        elementId={elementId}
        scope={scope}
      />
      <ExportMenu
        handleExportText={handleExportText}
        handleExportResult={handleExportResult}
        elementId={elementId}
        scope={scope}
      />
    </div>
  );
};

export default Toolbar;
