import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

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
    <aside className='sticky top-0 h-screen w-64 overflow-y-auto border-r bg-white p-4'>
      <h2 className='mb-4 font-bold text-gray-800'>Documentation</h2>
      <ul className='space-y-2'>
        {pages.map((p) => (
          <li key={p.slug}>
            <NavLink
              to={`/doc/${p.slug}`}
              className={({ isActive }) =>
                `block rounded px-2 py-1 hover:bg-gray-100 ${
                  isActive ? 'bg-gray-200 font-semibold' : ''
                }`
              }
            >
              {p.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
