import { renderWithProviders } from '@/__tests__/utils';
import { CollectionDetails } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useTags } from '@/hooks/data/tags/useTags';
import useDialog from '@/hooks/ui/useDialog';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import CollectionsManagerPage from '../CollectionsManagerPage';

vi.mock('@/hooks/data/collections/useCollections');
vi.mock('@/hooks/data/tags/useTags');
vi.mock('@/hooks/ui/useDialog');

const user = userEvent.setup();

describe('CollectionsManagerPage', () => {
  const mockCollections: CollectionDetails[] = [
    { id: 'col-1', name: 'Collection 1', tags: [], contentSize: 0, offline: false },
    { id: 'col-2', name: 'Collection 2', tags: ['tag-1'], contentSize: 5, offline: false },
  ];

  beforeEach(() => {
    (useCollections as Mock).mockReturnValue({
      collections: [],
      removeCollection: vi.fn(),
    });
    (useTags as Mock).mockReturnValue({
      getTagsByIds: vi.fn().mockReturnValue([]),
    });
    (useDialog as Mock).mockReturnValue({
      openImportCollectionDialog: vi.fn(),
      openNewCollectionDialog: vi.fn(),
      openExportCollectionDialog: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("la page affiche les boutons create/import et indique qu'il n'y a pas de collection", () => {
    renderWithProviders(<CollectionsManagerPage />);

    expect(screen.getByRole('button', { name: 'btn_create_collection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'btn_import_collection' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('info_no_collection')).toBeInTheDocument();
  });

  it('la page affiche un tableau de 2 collections', () => {
    (useCollections as Mock).mockReturnValue({
      collections: mockCollections,
      removeCollection: vi.fn(),
    });
    (useTags as Mock).mockReturnValue({
      getTagsByIds: vi.fn((ids: string[]) =>
        ids.includes('tag-1') ? [{ id: 'tag-1', label: 'Tag 1' }] : [],
      ),
    });

    renderWithProviders(<CollectionsManagerPage />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table_col_title_collection_name' }),
    ).toBeInTheDocument();
    expect(screen.getByText('info_number_of_collections')).toBeInTheDocument();

    // Check row count: 2 data rows + 1 header + 1 footer
    expect(screen.getAllByRole('row')).toHaveLength(4);

    expect(screen.getByText('info_empty_collection')).toBeInTheDocument();
    expect(screen.getByText('info_number_of_items')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'btn_delete' })).toHaveLength(2);
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
  });

  it('affiche le formulaire de création de liste', async () => {
    const openNewCollectionDialog = vi.fn();
    (useDialog as Mock).mockReturnValue({
      openImportCollectionDialog: vi.fn(),
      openNewCollectionDialog,
      openExportCollectionDialog: vi.fn(),
    });

    renderWithProviders(<CollectionsManagerPage />);

    const btn = screen.getByRole('button', { name: 'btn_create_collection' });
    await user.click(btn);

    expect(openNewCollectionDialog).toHaveBeenCalled();
  });
});
