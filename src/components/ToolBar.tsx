import AnalysisMenu from './menu/AnalysisMenu';
import DangerousMenu from './menu/DangerousMenu';
import ExportMenu from './menu/ExportMenu';

const Toolbar = ({
  title,
  handleLayout,
  handleOcr,
  handleDeleteAllAnnotations,
  handleExportText,
  handleExtractData,
  isRunning,
}: {
  title?: string;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleDeleteAllAnnotations?: () => void;
  handleExportText?: () => void;
  handleExtractData?: () => void;
  isRunning: boolean;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleExtractData={handleExtractData}
        isRunning={isRunning}
      />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        isRunning={isRunning}
      />
      <ExportMenu handleExportText={handleExportText} isRunning={isRunning} />
    </div>
  );
};

export default Toolbar;
