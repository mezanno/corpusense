import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useCaseContent from '/docs/usecase.md?raw';

const DocumentationPage = () => {
  return (
    <div className='mx-auto prose p-4'>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{useCaseContent}</ReactMarkdown>
    </div>
  );
};

export default DocumentationPage;
