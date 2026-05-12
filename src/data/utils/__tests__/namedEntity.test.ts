import { describe, expect, it, vi } from 'vitest';
import { Annotation, ElementType } from '../../models/Annotation';
import { DataField } from '../../models/DataModel';
import { computeSelector, generateNamedEntity } from '../namedEntity';

vi.mock('uuid', () => ({
    v4: () => 'fixed-uuid',
}));

describe('namedEntity utils', () => {
    const mockAnnotations: Annotation[] = [
        {
            id: 'anno-1',
            canvasId: 'c1',
            collectionId: 'col1',
            order: 0,
            type: ElementType.TEXT_LINE,
            target: {
                annotation: 'anno-1',
                selector: {
                    type: 'RECTANGLE',
                    geometry: { bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 }, x: 0, y: 0, w: 10, h: 10 }
                }
            },
            bodies: [
                {
                    id: 'b1',
                    annotation: 'anno-1',
                    purpose: 'tagging',
                    value: 'Hello world this is a test'
                }
            ]
        } as Annotation,
        {
            id: 'anno-2',
            canvasId: 'c1',
            collectionId: 'col1',
            order: 1,
            type: ElementType.TEXT_LINE,
            target: {
                annotation: 'anno-2',
                selector: {
                    type: 'RECTANGLE',
                    geometry: { bounds: { minX: 0, minY: 10, maxX: 10, maxY: 20 }, x: 0, y: 10, w: 10, h: 10 }
                }
            },
            bodies: [
                {
                    id: 'b2',
                    annotation: 'anno-2',
                    purpose: 'tagging',
                    value: 'Another line with world'
                }
            ]
        } as Annotation
    ];

    describe('computeSelector', () => {
        it('should find word indexes in annotations', () => {
            const result = computeSelector('world test', mockAnnotations);

            expect(result).toHaveLength(2);
            // anno-1 contains 'world' and 'test'
            expect(result[0].annotationId).toBe('anno-1');
            // 'world' is 2nd word (index 1), 'test' is 6th word (index 5)
            expect(result[0].indexes).toContain(1);
            expect(result[0].indexes).toContain(5);

            // anno-2 contains 'world'
            expect(result[1].annotationId).toBe('anno-2');
            expect(result[1].indexes).toContain(3); // 'world' is 4th word
        });
    });

    describe('generateNamedEntity', () => {
        it('should generate a named entity with correct properties', () => {
            const mockField: DataField = {
                id: 'field-1',
                name: 'entity',
                type: 'string',
                description: 'desc',
                color: '#000',
                generated: false
            };

            const result = generateNamedEntity(mockField, 'world', mockAnnotations);

            expect(result.id).toBe('fixed-uuid');
            expect(result.dataFieldId).toBe('field-1');
            expect(result.value).toBe('world');
            expect(result.selector).toHaveLength(2);
            expect(result.annotationIds).toEqual(['anno-1', 'anno-2']);
        });
    });
});
