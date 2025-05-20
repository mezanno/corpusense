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
  elementId,
}: {
  title?: string;
  handleLayout?: () => void;
  handleOcr?: () => void;
  handleDeleteAllAnnotations?: () => void;
  handleExportText?: () => void;
  handleExtractData?: () => void;
  elementId: string;
}) => {
  return (
    <div className='flex items-center space-x-2'>
      {title !== undefined && <h2 className='text-md'>{title}</h2>}
      <AnalysisMenu
        handleLayout={handleLayout}
        handleOcr={handleOcr}
        handleExtractData={handleExtractData}
        elementId={elementId}
      />
      <DangerousMenu
        handleDeleteAllAnnotations={handleDeleteAllAnnotations}
        elementId={elementId}
      />
      <ExportMenu handleExportText={handleExportText} elementId={elementId} />
    </div>
  );
};

export default Toolbar;
