import { getPreloadedState } from '@/__tests__/preloadedState';
import { workerInitialState } from '@/state/reducers/workers';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../__tests__/utils';
import ConfigurationPage from '../ConfigurationPage';

const user = userEvent.setup();

describe('ConfigurationPage', () => {
  let localStorageMock: Record<string, string>;

  const preloadedState = getPreloadedState({
    workers: {
      ...workerInitialState,
      workerPluginsInfo: [
        {
          name: 'mistral',
          displayName: 'Mistral AI',
          hasExport: false,
          configurationParams: {
            api_key: { description: 'API Key', defaultValue: '' },
          },
        },
      ],
    },
  });

  beforeEach(() => {
    // Setup ResizeObserver mock
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

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

  it('renders the configuration page with form', async () => {
    renderWithProviders(<ConfigurationPage />, { preloadedState });

    expect(screen.getByText('page_title_configuration')).toBeInTheDocument();
    const apiTab = screen.getByRole('tab', { name: 'tab_configuration_api' });
    await user.click(apiTab);
    expect(screen.getByLabelText(/Mistral AI : API Key/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'btn_save' })).toBeInTheDocument();
  });

  it('allows entering Mistral API key', async () => {
    renderWithProviders(<ConfigurationPage />, { preloadedState });

    const apiTab = screen.getByRole('tab', { name: 'tab_configuration_api' });
    await user.click(apiTab);

    const input = screen.getByLabelText(/Mistral AI : API Key/);
    await user.type(input, 'test-api-key');

    expect(input).toHaveValue('test-api-key');
  });

  it('saves API key to localStorage on form submission', async () => {
    renderWithProviders(<ConfigurationPage />, { preloadedState });

    const apiTab = screen.getByRole('tab', { name: 'tab_configuration_api' });
    await user.click(apiTab);

    const input = screen.getByLabelText(/Mistral AI : API Key/);
    await user.type(input, 'test-api-key');

    const saveButton = screen.getByRole('button', { name: 'btn_save' });
    await user.click(saveButton);

    expect(localStorageMock['mistral_api_key']).toBe('test-api-key');
  });
});
