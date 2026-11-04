// Regression tests for the "canvas never loads" bug introduced when
// data/utils/canvas.ts getSource was rewritten as the useTileSource hook.
//
// The rewrite dropped two behaviors the viewer depends on:
// 1. An image body WITHOUT an IIIF service resolved to [{ type: 'image', url }]
//    (e09ffca, data/utils/canvas.ts getSource). Without a fallback the hook left
//    `source` untouched and errorless; CanvasViewerOSDContent then opened the
//    viewer with an empty tileSources array, and OpenSeadragon.Viewer.open([]) is
//    a silent no-op -> blank canvas, no error message.
// 2. The old load path wrapped everything in try/catch + setError. Without it,
//    a rejection left the viewer blank with no visible error.

import canvasWithImage from '@/__tests__/canvasWithImage.json';
import manifestJson from '@/__tests__/manifest.json';
import { Canvas } from '@iiif/presentation-3';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useTileSource from '../useTileSource';

const getSourceWithContent = vi.fn();
const getLocalObjectUrl = vi.fn();

vi.mock('../useSources', () => ({
  default: () => ({ getSourceWithContent }),
}));

vi.mock('@/components/reducers/CollectionContext', () => ({
  useCollectionContext: () => ({ getLocalObjectUrl }),
}));

const remoteContent = {
  id: 'source-1',
  type: 'remote' as const,
  manifest: manifestJson,
};

describe('useTileSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSourceWithContent.mockResolvedValue({
      ok: true,
      value: { id: 'source-1', content: remoteContent },
    });
  });

  it('resolves a canvas whose image has an IIIF service', async () => {
    const { result } = renderHook(() =>
      useTileSource({ canvas: canvasWithImage as unknown as Canvas, sourceId: 'source-1' }),
    );
    await waitFor(() =>
      expect(result.current.source).toEqual([
        'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k2012653g/f15/info.json',
      ]),
    );
    expect(result.current.error).toBeNull();
  });

  it('resolves a canvas whose image has no IIIF service as a plain image tile source', async () => {
    const canvas = structuredClone(canvasWithImage) as {
      items: { items: { body: Record<string, unknown> }[] }[];
    };
    delete canvas.items[0].items[0].body.service;
    const imageId = canvas.items[0].items[0].body.id as string;

    const { result } = renderHook(() =>
      useTileSource({ canvas: canvas as unknown as Canvas, sourceId: 'source-1' }),
    );

    await waitFor(() => expect(result.current.source).toEqual([{ type: 'image', url: imageId }]));
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error instead of leaving the viewer silently blank', async () => {
    getSourceWithContent.mockResolvedValue({ ok: false });

    const { result } = renderHook(() =>
      useTileSource({ canvas: canvasWithImage as unknown as Canvas, sourceId: 'missing' }),
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.source).toBeNull();
  });

  it('never exposes an empty tile source list: source stays null until resolved', async () => {
    let resolveContent: (v: unknown) => void = () => {};
    getSourceWithContent.mockReturnValue(new Promise((r) => (resolveContent = r)));

    const { result } = renderHook(() =>
      useTileSource({ canvas: canvasWithImage as unknown as Canvas, sourceId: 'source-1' }),
    );

    expect(result.current.source).toBeNull();
    resolveContent({ ok: true, value: { id: 'source-1', content: remoteContent } });
    await waitFor(() => expect(result.current.source).not.toBeNull());
    expect(result.current.source).not.toEqual([]);
  });
});
