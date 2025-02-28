import { renderWithProviders } from '@/__tests__/utils';
import { useAppDispatch } from '@/hooks/hooks';
import {
  fetchManifestFromContentRequest,
  fetchManifestFromUrlRequest,
} from '@/state/reducers/manifests';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ManifestExplorerDrawer, { DrawerTabs } from './ManifestExplorerDrawer';

//on va devoir espionner l'appel à useAppDispatch pour voir si les actions sont appelées
vi.mock('@/hooks/hooks', async (original) => {
  const actual = await original<typeof useAppDispatch>();
  return {
    ...actual,
    useAppDispatch: vi.fn(),
  };
});

const user = userEvent.setup();

describe('ManifestExplorerDrawer', () => {
  it('Open the ManifestExplorerDrawer', async () => {
    renderWithProviders(<ManifestExplorerDrawer />);

    //le bouton pour ouvrir le drawer doit être visible
    const openManifestDrawerButton = screen.getByRole('button', {
      name: 'Open manifest dialog',
    });
    expect(openManifestDrawerButton).toBeInTheDocument();
    //lorsque l'on clique dessus
    await user.click(openManifestDrawerButton);
    //le drawer apparaît (titre = Open a Manifest)
    await screen.findByText('Open a Manifest');
  });
});

describe('ManifestExplorerDrawer - DrawerTabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Open a manifest with an url through the ManifestExplorerDrawer', async () => {
    //on mock le retour de useAppDispatch pour pouvoir voir ce qui a été envoyé dedans
    const mockDispatch = vi.fn();
    (useAppDispatch as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

    renderWithProviders(<DrawerTabs />);

    //2 tabs (I've got an URL) sont affichées
    const tabURL = screen.getByRole('tab', { name: "I've got an URL" });
    expect(tabURL).toBeInTheDocument();

    //Par défaut, la tab URL est sélectionnée
    expect(tabURL).toHaveAttribute('aria-selected', 'true');
    //le formulaire pour l'URL est visible
    const formURL = screen.getByRole('textbox', { name: 'Manifest URL' });
    expect(formURL).toBeInTheDocument();

    await user.type(formURL, 'https://example.com/manifest.json');
    const btn = screen.getByRole('button', { name: 'Open' });
    await user.click(btn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchManifestFromUrlRequest('https://example.com/manifest.json'),
      );
    });
  });

  it('Open a manifest with the its content (100 characters min) through the ManifestExplorerDrawer ', async () => {
    //on mock le retour de useAppDispatch pour pouvoir voir ce qui a été envoyé dedans
    const mockDispatch = vi.fn();
    (useAppDispatch as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

    renderWithProviders(<DrawerTabs />);

    //la tab (I want to paste the conten) doit être  affichée
    const tabPaste = screen.getByRole('tab', { name: 'I want to paste the content' });
    expect(tabPaste).toBeInTheDocument();

    //Par défaut, la tab URL est sélectionnée, on clic sur le tab Past
    await user.click(tabPaste);
    await waitFor(() => {
      expect(tabPaste).toHaveAttribute('aria-selected', 'true');
    });

    //on ajoute un contenu dans le formulaire (au moins 100 caractères)
    const formContent = screen.getByRole('textbox', { name: 'Manifest content' });
    expect(formContent).toBeInTheDocument();
    const contentOf100Characters =
      'le contenu doit faire au moins cent caractères pour être pris en compte par la validation du formulaire';
    await user.type(formContent, contentOf100Characters);
    //et on clic sur Open
    const btn = screen.getByRole('button', { name: 'Open' });
    expect(btn).toBeInTheDocument();
    await user.click(btn);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        fetchManifestFromContentRequest(contentOf100Characters),
      );
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  //TODO! tester les cas où c'est censé ne pas fonctionner
});
