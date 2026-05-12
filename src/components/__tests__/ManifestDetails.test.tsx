import manifest from '@/__tests__/manifest.json';
import { renderWithProviders } from '@/__tests__/utils';
import { Manifest } from '@iiif/presentation-3';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ManifestDetails from '../ManifestDetails';

describe('ManifestDetails', () => {
  const mockManifest = manifest as unknown as Manifest;

  it('should render manifest details', () => {
    renderWithProviders(<ManifestDetails manifest={mockManifest} />);

    expect(screen.getByRole('region', { name: 'manifest details' })).toBeInTheDocument();
    expect(screen.getByTestId('clover-label')).toBeInTheDocument();
    expect(screen.getByTestId('clover-summary')).toBeInTheDocument();
  });

  it('should render metadata from manifest', () => {
    renderWithProviders(<ManifestDetails manifest={mockManifest} />);
    expect(screen.getByTestId('clover-metadata')).toBeInTheDocument();
  });
});
