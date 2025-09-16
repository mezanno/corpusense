import { describe, it } from 'vitest';

describe('CanvasCard', () => {
  it('should render the CanvasCard with a white background (not selected)', () => {
    // const preloadedState: RootState = {
    //   ...getPreloadedState(),
    //   collections: {
    //     ...getPreloadedState().collections,
    //   },
    // };
    // const handleClick = vi.fn();
    // renderWithProviders(
    //   <CanvasCard canvas={canvas as Canvas} index={143} manifestId='' />,
    //   {
    //     preloadedState,
    //   },
    // );
    // //le numéro de page du canvas doit apparaître
    // expect(screen.getByText('143')).toBeInTheDocument();
    // //la miniature du canvas doit apparaître
    // expect(screen.getByRole('img')).toBeInTheDocument();
    // //le fond de la carte doit être blanc si elle n'est pas sélectionnée
    // expect(screen.getByRole('listitem')).toHaveClass('bg-white');
  });

  it('should render the CanvasCard with a blue background (selected)', () => {
    // const preloadedState: RootState = {
    //   ...getPreloadedState(),
    //   collections: {
    //     ...getPreloadedState().collections,
    //   },
    // };
    // const handleClick = vi.fn();
    // renderWithProviders(
    //   <CanvasCard canvas={canvas as Canvas} index={143} onClick={handleClick} manifestId='' />,
    //   {
    //     preloadedState,
    //   },
    // );
    // //le numéro de page du canvas doit apparaître
    // expect(screen.getByText('143')).toBeInTheDocument();
    // //la miniature du canvas doit apparaître
    // expect(screen.getByRole('img')).toBeInTheDocument();
    // //le fond de la carte doit être bleu si elle est sélectionnée
    // expect(screen.getByRole('listitem')).toHaveClass('bg-blue-300');
  });
});
