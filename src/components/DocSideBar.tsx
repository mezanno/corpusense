import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type DocIndex = { slug: string; title: string }[];

export default function DocsSidebar() {
  const [pages, setPages] = useState<DocIndex>([]);

  useEffect(() => {
    const loadDocIndex = async () => {
      try {
        const response = await fetch('./doc/index.json');
        const data = (await response.json()) as DocIndex;
        console.log('Loaded doc index:', data);

        setPages(data);
      } catch (error) {
        console.error('Failed to load documentation index:', error);
      }
    };
    void loadDocIndex();
  }, []);

  return (
    <nav className='w-[200px] border-r p-4'>
      <ul className='space-y-2'>
        {pages.map((p) => (
          <li key={p.slug}>
            <Link
              to={`/${CorpusenseRoutes.DOCUMENTATION}/${p.slug}`}
              className='text-blue-600 hover:underline'
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
