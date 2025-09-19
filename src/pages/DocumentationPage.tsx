import DocsSidebar from '@/components/DocSideBar';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

const DocumentationPage = () => {
  const { page } = useParams(); // ex: 'howto'
  const [content, setContent] = useState<string | null>(null);
  const [headings, setHeadings] = useState<{ level: number; text: string; slug: string }[]>([]);

  console.log('content: ', content);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`./${page}.md`);
        const text = await response.text();

        setContent(text);
        extractHeadings(text);
      } catch (error) {
        console.error('Failed to load documentation index:', error);
      }
    };
    if (page !== undefined) {
      void loadPage();
    }
  }, [page]);

  // extrait les h1/h2/h3 pour le sommaire
  const extractHeadings = (md: string) => {
    const regex = /^(#{1,3})\s+(.*)$/gm;
    const matches = [];
    let match;
    while ((match = regex.exec(md)) !== null) {
      const level = match[1].length; // nombre de # → niveau
      const text = match[2].trim();
      const slug = text
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '');
      matches.push({ level, text, slug });
    }
    setHeadings(matches);
  };

  return (
    <div className='mx-auto flex max-w-7xl'>
      {/* Menu global */}
      <DocsSidebar />

      {/* Contenu Markdown + sommaire interne */}
      <main className='prose max-w-none flex-1 p-4'>
        {/* {headings.length > 0 && (
          <nav className='mb-4 border-l-4 border-gray-300 pl-2'>
            <h3 className='mb-2 font-bold'>Sommaire</h3>
            <ul className='space-y-1'>
              {headings.map((h) => (
                <li key={h.slug} className={`ml-${(h.level - 1) * 4}`}>
                  <a href={`#${h.slug}`} className='text-blue-600 hover:underline'>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )} */}
        {content !== null && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
          >
            {content}
          </ReactMarkdown>
        )}
      </main>
    </div>
  );
};

export default DocumentationPage;
