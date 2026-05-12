import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfigurationPage from '../ConfigurationPage';
import { renderWithProviders } from '../../__tests__/utils';

const user = userEvent.setup();

describe('ConfigurationPage', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
    });
  });

  it('renders the configuration page with form', () => {
    renderWithProviders(<ConfigurationPage />);

    expect(screen.getByText('page_title_configuration')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'form_label_mistral_api_key' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'btn_save' })).toBeInTheDocument();
  });

  it('allows entering Mistral API key', async () => {
    renderWithProviders(<ConfigurationPage />);

    const input = screen.getByRole('textbox', { name: 'form_label_mistral_api_key' });
    await user.type(input, 'test-api-key');

    expect(input).toHaveValue('test-api-key');
  });

  it('saves API key to localStorage on form submission', async () => {
    renderWithProviders(<ConfigurationPage />);

    const input = screen.getByRole('textbox', { name: 'form_label_mistral_api_key' });
    await user.type(input, 'test-api-key');

    const saveButton = screen.getByRole('button', { name: 'btn_save' });
    await user.click(saveButton);

    expect(localStorageMock['mistralApiKey']).toBe('test-api-key');
  });
});
