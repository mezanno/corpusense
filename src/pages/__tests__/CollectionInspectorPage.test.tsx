import { useAppDispatch } from '@/hooks/hooks';
import { render, screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CollectionInspectorPage from '../CollectionInspectorPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock('@/hooks/hooks', async (original) => {
  const actual = await original<typeof useAppDispatch>();
  return {
    ...actual,
    useAppDispatch: vi.fn(),
  };
});

describe('CollectionInspectorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display error message when collectionId is undefined', () => {
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ collectionId: 'test-collection-id' });

    render(<CollectionInspectorPage />);
    expect(screen.getByText('error_id_collection_invalid')).toBeInTheDocument();
  });

  // it('should dispatch addCollectionToHistoryRequest when collectionId is provided', () => {
  //   useAppSelector.mockImplementation((selector) => {
  //     return mockCollection;
  //   });

  //   render(<CollectionInspectorPage />);
  //   expect(mockDispatch).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       type: expect.stringContaining('addCollectionToHistoryRequest'),
  //     }),
  //   );
  // });

  // it('should render collection content when collection exists', () => {
  //   useAppSelector.mockImplementation((selector) => {
  //     return mockCollection;
  //   });

  //   render(<CollectionInspectorPage />);
  //   expect(screen.getByTestId('collection-metadata-form')).toBeInTheDocument();
  //   expect(screen.getByTestId('collection-toolbar')).toBeInTheDocument();
  //   expect(screen.getByTestId('canvas-viewer')).toBeInTheDocument();
  // });

  // it('should switch between document and text views', () => {
  //   useAppSelector.mockImplementation(() => mockCollection);

  //   render(<CollectionInspectorPage />);

  //   expect(screen.getByTestId('canvas-viewer')).toBeInTheDocument();
  //   expect(screen.queryByTestId('text-viewer')).not.toBeInTheDocument();

  //   fireEvent.click(screen.getByText('Vue texte'));

  //   expect(screen.queryByTestId('canvas-viewer')).not.toBeInTheDocument();
  //   expect(screen.getByTestId('text-viewer')).toBeInTheDocument();
  // });

  // it('should render thumbnails for each canvas in the collection', () => {
  //   useAppSelector.mockImplementation((selector) => {
  //     if (typeof selector === 'function') {
  //       // Mock getCanvasById selector
  //       return { thumbnail: [{ id: 'thumb-1' }] };
  //     }
  //     return mockCollection;
  //   });

  //   render(<CollectionInspectorPage />);

  //   // We expect thumbnails for both canvases
  //   const thumbnails = screen.getAllByTestId('thumbnail');
  //   expect(thumbnails).toHaveLength(2);
  // });
});
