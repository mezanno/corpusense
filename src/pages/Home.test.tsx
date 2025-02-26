import { renderWithProviders } from '@/__tests__/utils';
import { screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import HomePAge from './HomePage';

test('Affiche la Home page', () => {
  renderWithProviders(<HomePAge />);

  expect(screen.getByText('Home')).toBeInTheDocument();
});
