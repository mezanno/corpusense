import AnalysisMenu from './AnalysisMenu';
import DangerousMenu from './DangerousMenu';
import ExportMenu from './ExportMenu';

const Toolbar = ({
  title,
  handleLayout,
  handleOcr,
  handleDeleteAllAnnotations,
  handleExportText,
}: {
  title?: string;
  handleLayout: () => void;
  handleOcr: () => void;
  handleDeleteAllAnnotations: () => void;
  handleExportText: () => void;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu handleLayout={handleLayout} handleOcr={handleOcr} isRunning={false} />
      <DangerousMenu handleDeleteAllAnnotations={handleDeleteAllAnnotations} isRunning={false} />
      <ExportMenu handleExportText={handleExportText} isRunning={false} />
    </div>
  );
};

export default Toolbar;
