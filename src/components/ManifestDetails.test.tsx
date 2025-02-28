import { getPreloadedState } from '@/__tests__/preloadedState';
import { renderWithProviders } from '@/__tests__/utils';
import { RootState } from '@/state/store';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ManifestDetails from './ManifestDetails';

describe('ManifestDetails', () => {
  it('should display loading if manifest is loading', () => {
    const preloadedState: RootState = {
      ...getPreloadedState(),
      manifests: {
        ...getPreloadedState().manifests,
        isLoading: true,
      },
    };
    renderWithProviders(<ManifestDetails />, { preloadedState });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');

    expect(screen.queryByRole('region', { name: 'manifest details' })).not.toBeInTheDocument();
    // screen.getByRole('toto');
  });
});
