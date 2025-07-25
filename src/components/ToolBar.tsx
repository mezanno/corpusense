import { Scope } from '@/data/models/Scope';
import { Worker } from '@/data/models/Worker';
import AnalysisMenu from './menu/AnalysisMenu';
import DangerousMenu from './menu/DangerousMenu';
import ExportMenu from './menu/ExportMenu';
import UnfinishedWorkerMenu from './menu/UnfinishedWorkerMenu';

const Toolbar = ({
  title,
  handleLayout,
  handleOcr,
  handleOcrWrite,
  handleDeleteAllAnnotations,
  handleRecomputeRegions,
  handleExportText,
  handleExtractData,
  handleExportResult,
  handleRecoverWorker,
  scope,
}: {
  title?: string;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleOcrWrite?: () => void;
  handleDeleteAllAnnotations?: () => void;
  handleRecomputeRegions?: () => void;
  handleExportText?: () => void;
  handleExtractData?: () => void;
  handleExportResult?: (worker: Worker) => void;
  handleRecoverWorker?: (worker: Worker) => void;
  scope: Scope;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleOcrWrite={handleOcrWrite}
        handleExtractData={handleExtractData}
        scope={scope}
      />
      <UnfinishedWorkerMenu scope={scope} handleRecoverWorker={handleRecoverWorker} />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        handleRecomputeRegions={handleRecomputeRegions}
        scope={scope}
      />
      <ExportMenu
        handleExportText={handleExportText}
        handleExportResult={handleExportResult}
        scope={scope}
      />
    </div>
  );
};

export default Toolbar;
