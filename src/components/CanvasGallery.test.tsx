import { afterAll, beforeAll, describe, it } from 'vitest';

describe('CanvasGallery', () => {
  /*
  originalOffsetHeight et originalOffsetWidth sont nécessaire pour que la grille de la gallerie soit testable
  Il faut que les nouvelles valeurs soient assez grande pour que toutes les cartes soient affichées
  */
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  );
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 1000,
    });
  });

  afterAll(() => {
    if (originalOffsetHeight) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    }
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    }
  });

  it('La gallerie affiche les cartes des canvas dans une grille ', async () => {
    // const data = manifest as Manifest;
    // const preloadedState: RootState = {
    //   ...getPreloadedState(),
    //   manifests: {
    //     ...getPreloadedState().manifests,
    //     loadedData: { content: data, metadata: [] },
    //   },
    // };
    // const nbOfItems = data.items.length;
    // renderWithProviders(<CanvasGallery />, { preloadedState });
    // await waitFor(() => {
    //   expect(screen.getAllByRole('listitem')).toHaveLength(nbOfItems);
    // });
  });
});
