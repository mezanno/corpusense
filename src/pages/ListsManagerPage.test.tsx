import canvasContent from '@/__tests__/canvas.json';
import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { Canvas } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ListsManagerPage from './ListsManagerPage';

describe('ListsManagerPage', () => {
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

    //on doit avoir 3 lignes (2 listes + 1 header)
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
    renderWithProviders(<ListsManagerPage />);

    const textbox = screen.queryByRole('textbox', { name: 'Nom de la liste' });
    expect(textbox).not.toBeInTheDocument();
    const btn = screen.getByRole('button', { name: 'Créer une nouvelle liste' });

    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);

    // screen.getByRole('toto');

    //todo : vérifier que le formulaire appelle bien le dispatch
  });
});
