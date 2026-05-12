import { Mock, vi } from 'vitest';

// 1. Mock dependency modules
vi.mock('../../repositories/indexeddb/dbFactory', () => ({
    getAnnotationRepository: vi.fn(),
    getCollectionRepository: vi.fn(),
    getTagRepository: vi.fn(),
}));

// Mock db to avoid initialization errors
vi.mock('@/data/repositories/indexeddb/db', () => ({
    db: {
        version: vi.fn().mockReturnThis(),
        stores: vi.fn().mockReturnThis(),
    },
}));

vi.mock('i18next', () => ({
    default: {
        t: (key: string) => key,
    },
}));

// 2. Import everything else AFTER mocks
import { Annotation } from '../../models/Annotation';
import { getAnnotationRepository } from '../../repositories/indexeddb/dbFactory';
import { generateTextFromCanvas, generateTextWithAnnotationIdFromCanvas } from '../export';

describe('export utils', () => {
    const mockAnnotations: Annotation[] = [
        {
            id: 'anno-1',
            bodies: [{ purpose: 'tagging', value: 'Hello' }],
        } as Annotation,
        {
            id: 'anno-2',
            bodies: [{ purpose: 'tagging', value: 'World' }],
        } as Annotation,
    ];

    const mockRepo = {
        getByScope: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getAnnotationRepository as Mock).mockReturnValue(mockRepo);
    });

    describe('generateTextFromCanvas', () => {
        it('should concatenate annotation texts', async () => {
            mockRepo.getByScope.mockResolvedValue(mockAnnotations);
            const text = await generateTextFromCanvas('canvas-1', 'col-1');
            expect(text).toBe('Hello\nWorld\n');
        });

        it('should return empty string if no annotations', async () => {
            mockRepo.getByScope.mockResolvedValue([]);
            const text = await generateTextFromCanvas('canvas-1', 'col-1');
            expect(text).toBe('');
        });
    });

    describe('generateTextWithAnnotationIdFromCanvas', () => {
        it('should return array of objects with text and id', async () => {
            mockRepo.getByScope.mockResolvedValue(mockAnnotations);
            const result = await generateTextWithAnnotationIdFromCanvas('canvas-1', 'col-1');
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ text: 'Hello', annotationId: 'anno-1' });
            expect(result[1]).toEqual({ text: 'World', annotationId: 'anno-2' });
        });
    });
});
