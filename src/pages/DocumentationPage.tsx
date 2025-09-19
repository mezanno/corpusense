import ReactMarkdown from 'react-markdown';
import useCaseContent from '/docs/usecase.md?raw';

const DocumentationPage = () => {
  return (
    <div>
      <ReactMarkdown>{useCaseContent}</ReactMarkdown>
    </div>
  );
};

export default DocumentationPage;
