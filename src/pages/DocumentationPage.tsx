import DocsSidebar from '@/components/DocSideBar';
import GithubSlugger from 'github-slugger';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

// extrait les h1/h2/h3 pour le sommaire
const extractHeadings = (md: string) => {
  const regex = /^(#{1,3})\s+(.*)$/gm;
  const matches = [];
  let match;
  /*
  GithubSlugger permet de créer des id compatibles avec GitHub (espaces remplacés par des tirets, minuscules, etc.)
  Il s'agit du même système que celui utilisé par rehypeSlug pour générer les id dans le contenu Markdown.
  --> Ainsi, les liens du sommaire correspondent aux id des titres dans le contenu.
  */
  const slugger = new GithubSlugger();
  while ((match = regex.exec(md)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = slugger.slug(text);
    matches.push({ level, text, slug });
  }
  return matches;
};

const DocumentationPage = () => {
  const { page } = useParams(); // ex: 'howto'
  const [content, setContent] = useState<string | null>(null);
  const [headings, setHeadings] = useState<{ level: number; text: string; slug: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);

  // Gérer la détection du titre actif selon le scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' },
    );

    const headingElements = contentRef.current?.querySelectorAll('h1, h2, h3');
    headingElements?.forEach((el) => observer.observe(el));

    return () => headingElements?.forEach((el) => observer.unobserve(el));
  }, [content]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`./${page}.md`);
        const text = await response.text();

        setContent(text);
        setHeadings(extractHeadings(text));
      } catch (error) {
        console.error('Failed to load documentation index:', error);
      }
    };
    if (page !== undefined) {
      void loadPage();
    }
  }, [page]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className='flex bg-white'>
      {/* Menu global */}
      <DocsSidebar />

      {/* Contenu principal + sommaire */}
      <main className='flex flex-1'>
        {/* Sommaire interne */}
        {headings.length > 0 && (
          <nav className='sticky top-0 h-screen w-64 overflow-y-auto border-l bg-gray-50 p-4'>
            <h3 className='mb-2 font-bold text-gray-700'>Sommaire</h3>
            <ul className='space-y-1'>
              {headings.map((h) => (
                <li
                  key={h.slug}
                  className={`ml-${(h.level - 1) * 4} ${
                    activeId === h.slug ? 'font-bold text-blue-600' : ''
                  }`}
                >
                  <button
                    onClick={() => scrollTo(h.slug)}
                    className='w-full text-left hover:underline'
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {/* Contenu Markdown */}
        <div ref={contentRef} className='prose max-w-none flex-1 p-6 prose-gray'>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </main>
    </div>
  );
};

export default DocumentationPage;
