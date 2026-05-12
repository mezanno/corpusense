import { Manifest } from '@iiif/presentation-3';
import { describe, expect, it, vi } from 'vitest';
import { extractCanvasById, extractCanvasesByIds, extractManifestDetails } from '../manifest';

vi.mock('i18next', () => ({
    default: {
        t: (key: string) => key,
    },
}));

describe('manifest utils', () => {
    const mockManifest: Manifest = {
        '@context': 'http://iiif.io/api/presentation/3/context.json',
        id: 'manifest-id',
        type: 'Manifest',
        label: { none: ['Manifest Label'] },
        summary: { none: ['Manifest Summary'] },
        thumbnail: [{ id: 'thumb-id', type: 'Image' }],
        items: [
            { id: 'canvas-1', type: 'Canvas' },
            { id: 'canvas-2', type: 'Canvas' },
        ],
    } as Manifest;

    describe('extractManifestDetails', () => {
        it('should extract name from summary preferentially', () => {
            const { name, thumbnail } = extractManifestDetails(mockManifest);
            expect(name).toBe('Manifest Summary');
            expect(thumbnail?.id).toBe('thumb-id');
        });

        it('should extract name from label if summary is missing', () => {
            const manifestWithoutSummary = { ...mockManifest, summary: undefined };
            const { name } = extractManifestDetails(manifestWithoutSummary as Manifest);
            expect(name).toBe('Manifest Label');
        });

        it('should return empty name if both summary and label are missing', () => {
            const emptyManifest = { ...mockManifest, summary: undefined, label: {} };
            const { name } = extractManifestDetails(emptyManifest as Manifest);
            expect(name).toBe('');
        });
    });

    describe('extractCanvasById', () => {
        it('should return the correct canvas', () => {
            const canvas = extractCanvasById(mockManifest, 'canvas-1');
            expect(canvas.id).toBe('canvas-1');
        });

        it('should throw error if canvas not found', () => {
            expect(() => extractCanvasById(mockManifest, 'non-existent')).toThrow('error_canvas_not_found');
        });
    });

    describe('extractCanvasesByIds', () => {
        it('should return filtered canvases', () => {
            const canvases = extractCanvasesByIds(mockManifest, ['canvas-1', 'canvas-2', 'canvas-3']);
            expect(canvases).toHaveLength(2);
            expect(canvases[0].id).toBe('canvas-1');
            expect(canvases[1].id).toBe('canvas-2');
        });

        it('should return empty array if no matches', () => {
            const canvases = extractCanvasesByIds(mockManifest, ['non-existent']);
            expect(canvases).toHaveLength(0);
        });
    });
});
