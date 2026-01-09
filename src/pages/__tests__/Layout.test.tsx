import { renderWithProviders } from '@/__tests__/utils';
import { useCollectionContext } from '@/components/reducers/CollectionContext';
import { useConnectedUserContext } from '@/components/reducers/ConnectedUserContext';
import { useWorkerContext } from '@/components/reducers/WorkerContext';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useManifests } from '@/hooks/data/manifests/useManifests';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import Layout from '../Layout';

vi.mock('@/hooks/data/manifests/useManifests');
vi.mock('@/hooks/data/collections/useCollections');
vi.mock('@/components/reducers/CollectionContext');
vi.mock('@/components/reducers/WorkerContext');
vi.mock('@/components/reducers/ConnectedUserContext');
vi.mock('@/hooks/ui/useDialog', () => ({
  default: () => ({
    openOpenManifestDialog: vi.fn(),
    openContactUsDialog: vi.fn(),
    openLoginDialog: vi.fn(),
  }),
}));

vi.mock('@/hooks/useExperimental', () => ({
  default: vi.fn(() => ({ experimentalFeaturesActivated: true })),
  getIsExperimentalFeaturesActivated: vi.fn(() => true),
  ExperimentalProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock providers to avoid IndexedDB/Supabase issues during Layout render
vi.mock('@/components/reducers/WorkerContext', () => ({
  useWorkerContext: vi.fn(),
  WorkerProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/reducers/ConnectedUserContext', () => ({
  useConnectedUserContext: vi.fn(),
  ConnectedUserProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/reducers/CollectionContext', () => ({
  useCollectionContext: vi.fn(),
  CollectionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/reducers/AlertDialogContext', () => ({
  useAlertDialogContext: vi.fn(),
  AlertDialogProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useManifests as Mock).mockReturnValue({
      historyDetails: [],
      removeFromHistory: vi.fn(),
    });
    (useCollections as Mock).mockReturnValue({
      collections: [],
    });
    (useCollectionContext as Mock).mockReturnValue({
      openedCollections: [],
      removeFromOpenedCollections: vi.fn(),
    });
    (useWorkerContext as Mock).mockReturnValue({
      getWorkersByStatus: vi.fn(() => []),
    });
    (useConnectedUserContext as Mock).mockReturnValue({
      user: null,
      logout: vi.fn(),
    });
  });

  it("HistoryDrawer affiche les liens de l'historique", async () => {
    (useManifests as Mock).mockReturnValue({
      historyDetails: [
        { id: '1', name: 'Manifest 1', thumbnail: undefined },
        { id: '2', name: 'Manifest 2', thumbnail: undefined },
      ],
      removeFromHistory: vi.fn(),
    });

    renderWithProviders(<Layout />);

    // The button has aria-label='btn_open_history'
    const trigger = screen.getByLabelText('btn_open_history');
    fireEvent.click(trigger);

    const nav = await screen.findByRole('navigation', { name: 'historique' });
    expect(nav.querySelectorAll('a').length).toBe(2);
    expect(screen.getByText('Manifest 1')).toBeInTheDocument();
  });

  it('Layout affiche le nombre de collections dans le gestionnaire', () => {
    (useCollections as Mock).mockReturnValue({
      collections: [{ id: 'col-1', name: 'Collection 1' }],
    });

    renderWithProviders(<Layout />);
    expect(screen.getByText('page_title_collection_manager')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('LayoutSideBar affiche les collections ouvertes', () => {
    (useCollectionContext as Mock).mockReturnValue({
      openedCollections: [{ id: 'col-1', name: 'Collection 1' }],
      removeFromOpenedCollections: vi.fn(),
    });

    renderWithProviders(<Layout />);

    expect(screen.getByText('Collection 1')).toBeInTheDocument();
  });
});
