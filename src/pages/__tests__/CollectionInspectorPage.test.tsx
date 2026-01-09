import { renderWithProviders } from '@/__tests__/utils';
import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import CollectionInspectorPage from '../CollectionInspectorPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock('@/hooks/data/collections/useCollections');
vi.mock('@/hooks/data/collections/useCollectionContent', () => ({
  useCollectionContent: vi.fn().mockReturnValue({
    collection: null,
    canvases: [],
    isLoading: false,
  }),
}));

describe('CollectionInspectorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display error message when collectionId is undefined', () => {
    (useParams as Mock).mockReturnValue({ collectionId: undefined });

    renderWithProviders(<CollectionInspectorPage />);
    expect(screen.getByText('error_id_collection_invalid')).toBeInTheDocument();
  });
});
