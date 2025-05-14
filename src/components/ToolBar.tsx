import AnalysisMenu from './AnalysisMenu';
import DangerousMenu from './DangerousMenu';
import ExportMenu from './ExportMenu';

const Toolbar = ({
  title,
  handleLayout,
  handleOcr,
  handleDeleteAllAnnotations,
  handleExportText,
  isRunning,
}: {
  title?: string;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleDeleteAllAnnotations?: () => void;
  handleExportText?: () => void;
  isRunning: boolean;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu handleLayout={handleLayout} handleOcr={handleOcr} isRunning={isRunning} />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        isRunning={isRunning}
      />
      <ExportMenu handleExportText={handleExportText} isRunning={isRunning} />
    </div>
  );
};

export default Toolbar;
