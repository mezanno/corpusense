import { renderWithProviders } from '@/__tests__/utils';
import { useAppDispatch } from '@/hooks/hooks';
import useAppNavigation from '@/hooks/useAppNavigation';
import { fetchManifestFromContentRequest } from '@/state/reducers/manifests';
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

// vi.mock('@/hooks/useAppNavigation', () => ({
//   __esModule: true, // This is important for mocking default exports
//   default: vi.fn(),
// }));

vi.mock('@/hooks/useAppNavigation', async (original) => {
  const actual = await original<typeof useAppNavigation>();
  return {
    ...actual,
    __esModule: true,
    default: vi.fn(),
    goToManifestExplorer: vi.fn(),
  };
});

const user = userEvent.setup();

describe('ManifestExplorerDrawer', () => {
  it('Open the ManifestExplorerDrawer', async () => {
    renderWithProviders(<ManifestExplorerDrawer />);

    //le bouton pour ouvrir le drawer doit être visible
    const openManifestDrawerButton = screen.getByRole('button', {
      name: 'btn_open_manifest',
    });
    expect(openManifestDrawerButton).toBeInTheDocument();
    //lorsque l'on clique dessus
    await user.click(openManifestDrawerButton);
    //le drawer apparaît (titre = btn_open_manifest)
    const drawerTitle = screen.getByRole('heading', { name: 'btn_open_manifest' });
    expect(drawerTitle).toBeInTheDocument();
  });
});

describe('ManifestExplorerDrawer - DrawerTabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Open a manifest with an url through the ManifestExplorerDrawer', async () => {
    const goToManifestExplorerMock = vi.fn();
    (useAppNavigation as ReturnType<typeof vi.fn>).mockReturnValue({
      goToManifestExplorer: goToManifestExplorerMock,
    });

    renderWithProviders(<DrawerTabs />);

    //2 tabs (I've got an URL) sont affichées
    const tabURL = screen.getByRole('tab', { name: 'tab_manifest_url' });
    expect(tabURL).toBeInTheDocument();

    //Par défaut, la tab URL est sélectionnée
    expect(tabURL).toHaveAttribute('aria-selected', 'true');
    //le formulaire pour l'URL est visible
    const formURL = screen.getByRole('textbox', { name: 'form_label_manifesturl' });
    expect(formURL).toBeInTheDocument();

    await user.type(formURL, 'https://example.com/manifest.json');
    const btn = screen.getByRole('button', { name: 'btn_open' });
    await user.click(btn);

    await waitFor(() => {
      // expect(mockDispatch).toHaveBeenCalledWith(
      //   fetchManifestFromUrlRequest({
      //     manifestId: 'https://example.com/manifest.json',
      //     forceV3: true,
      //   }),
      // );
      expect(goToManifestExplorerMock).toHaveBeenCalledWith(
        'https://example.com/manifest.json',
        true,
      );
    });
  });

  it('Open a manifest with its content (100 characters min) through the ManifestExplorerDrawer ', async () => {
    //on mock le retour de useAppDispatch pour pouvoir voir ce qui a été envoyé dedans
    const mockDispatch = vi.fn();
    (useAppDispatch as ReturnType<typeof vi.fn>).mockReturnValue(mockDispatch);

    renderWithProviders(<DrawerTabs />);

    //la tab (I want to paste the content) doit être  affichée
    const tabPaste = screen.getByRole('tab', { name: 'tab_manifest_content' });
    expect(tabPaste).toBeInTheDocument();

    //Par défaut, la tab URL est sélectionnée, on clic sur le tab Past
    await user.click(tabPaste);
    await waitFor(() => {
      expect(tabPaste).toHaveAttribute('aria-selected', 'true');
    });

    //on ajoute un contenu dans le formulaire (au moins 100 caractères)
    const formContent = screen.getByRole('textbox', { name: 'form_label_manifest_content' });
    expect(formContent).toBeInTheDocument();
    const contentOf100Characters =
      'le contenu doit faire au moins cent caractères pour être pris en compte par la validation du formulaire';
    await user.type(formContent, contentOf100Characters);
    //et on clic sur Open
    const btn = screen.getByRole('button', { name: 'btn_open' });
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
