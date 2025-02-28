import canvasContent from '@/__tests__/canvas.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { useAppDispatch } from '@/hooks/hooks';
import { addListRequest } from '@/state/reducers/lists';
import { RootState } from '@/state/store';
import { Canvas } from '@iiif/presentation-3';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListsManagerPage from './ListsManagerPage';

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

  it('la page affiche un tableau de 2 listes', () => {
    const canvas = canvasContent as Canvas;
    const preloadedState: RootState = {
      ...getPreloadedState(),
      lists: {
        ...getPreloadedState().lists,
        values: [
          { id: '1', name: 'List 1', content: [] },
          { id: '2', name: 'List 2', content: [{ index: 0, canvas }] },
        ],
      },
    };
    renderWithProviders(<ListsManagerPage />, { preloadedState });

    //une table doit être présente
    expect(screen.getByRole('table')).toBeInTheDocument();

    //on doit avoir 3 lignes dans le tableau (2 listes + 1 header)
    expect(screen.getAllByRole('row')).toHaveLength(3);
    // screen.getByRole('toto');

    //la première liste doit indiquer qu'elle est vide
    expect(screen.getByText('Liste vide')).toBeInTheDocument();

    //la deuxième liste doit indiquer qu'elle contient 1 élément
    expect(screen.getByRole('cell', { name: '1 élément(s)' })).toBeInTheDocument();
  });

  it("la page indique qu'il n'y a pas de liste", () => {
    renderWithProviders(<ListsManagerPage />, { preloadedState: getPreloadedState() });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText("Vous n'avez aucune liste actuellement")).toBeInTheDocument();
  });

  it('affiche le formulaire de création de liste', async () => {
    //on mock le retour de useAppDispatch pour pouvoir voir ce qui a été envoyé dedans
    const mockDispatch = vi.fn();
    (useAppDispatch as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

    renderWithProviders(<ListsManagerPage />);
    //le formulaire n'est pas visible
    const textboxNotVisible = screen.queryByRole('textbox', { name: 'Nom de la liste' });
    expect(textboxNotVisible).not.toBeInTheDocument();

    //on clic sur le bouton pour afficher le formulaire
    const btn = screen.getByRole('button', { name: 'Créer une nouvelle liste' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);

    //le formulaire est visible
    const textboxVisible = screen.getByRole('textbox', { name: 'Nom de la liste' });
    expect(textboxVisible).toBeInTheDocument();

    //on saisit un nom de liste
    await user.type(textboxVisible, 'nomListe');

    //on clic sur le bouton pour créer la liste
    const btnCreate = screen.getByRole('button', { name: 'Créer' });
    await userEvent.click(btnCreate);

    //le formulaire appelle le dispatch
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(addListRequest('nomListe'));
    });
  });
});
