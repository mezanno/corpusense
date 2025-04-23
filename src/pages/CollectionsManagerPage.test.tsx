import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { useAppDispatch } from '@/hooks/hooks';
import { createCollectionRequest } from '@/state/reducers/collections';
import { RootState } from '@/state/store';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CollectionsManagerPage from './CollectionsManagerPage';

vi.mock('@/hooks/hooks', async (original) => {
  const actual = await original<typeof useAppDispatch>();
  return {
    ...actual,
    useAppDispatch: vi.fn(),
  };
});

const user = userEvent.setup();

describe('ListsManagerPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("la page affiche les boutons create/import et indique qu'il n'y a pas de collection", () => {
    renderWithProviders(<CollectionsManagerPage />, { preloadedState: getPreloadedState() });

    expect(screen.getByRole('button', { name: 'btn_create_collection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'btn_import_collection' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('info_no_collection')).toBeInTheDocument();
  });

  it('la page affiche un tableau de 2 collections', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      collections: {
        ...getPreloadedState().collections,
        values: [
          { id: '1', name: 'Collection 1', content: [], tags: [] },
          {
            id: '2',
            name: 'Collection 2',
            content: [
              {
                canvasId: 'canvasId',
                collectionId: 'collectionId',
                position: 0,
                manifestId: 'manifestId',
              },
            ],
            tags: [],
          },
        ],
      },
    };
    renderWithProviders(<CollectionsManagerPage />, { preloadedState });

    //une table doit être présente
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table_col_title_collection_name' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table_col_title_collection_info' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'table_col_title_tags' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table_col_title_actions' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'info_number_of_collections' })).toBeInTheDocument();

    //on doit avoir 4 lignes dans le tableau (2 collections + 1 header + 1 footer)
    expect(screen.getAllByRole('row')).toHaveLength(4);

    //la première liste doit indiquer qu'elle est vide
    expect(screen.getByRole('cell', { name: 'info_empty_collection' })).toBeInTheDocument();

    //la deuxième liste doit indiquer qu'elle contient des éléments
    expect(screen.getByRole('cell', { name: 'info_number_of_items' })).toBeInTheDocument();

    //il doit y avoir 2 boutons de suppression
    expect(screen.getAllByRole('button', { name: 'btn_delete' }).length).toBe(2);
  });

  it('affiche le formulaire de création de liste', async () => {
    //on mock le retour de useAppDispatch pour pouvoir voir ce qui a été envoyé dedans
    const mockDispatch = vi.fn();
    (useAppDispatch as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

    renderWithProviders(<CollectionsManagerPage />);

    // //le formulaire n'est pas visible
    // const textboxNotVisible = screen.queryByRole('textbox', { name: 'Nom de la liste' });
    // expect(textboxNotVisible).not.toBeInTheDocument();

    //on clic sur le bouton pour afficher le formulaire
    const btn = screen.getByRole('button', { name: 'btn_create_collection' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);

    console.log(screen.debug());

    //le formulaire est visible
    const textboxVisible = screen.getByRole('textbox', { name: 'name' });
    expect(textboxVisible).toBeInTheDocument();

    //on saisit un nom de liste
    await user.type(textboxVisible, 'nomListe');

    //on clic sur le bouton pour créer la liste
    const btnCreate = screen.getByRole('button', { name: 'Créer' });
    await userEvent.click(btnCreate);

    //le formulaire appelle le dispatch
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(createCollectionRequest('nomListe'));
    });
  });
});
