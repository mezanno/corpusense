import { describe, expect, it, vi } from 'vitest';
import { DataModel } from '../../models/DataModel';
import { generatePreview, generateSchema } from '../model';

vi.mock('i18next', () => ({
    default: {
        t: (key: string) => (key === 'ia_generated' ? ' (IA)' : key),
    },
}));

describe('model utils', () => {
    const mockModel: DataModel = {
        id: 'model-1',
        name: 'Test Model',
        description: 'Description',
        prompt: 'Prompt',
        fields: [
            {
                id: 'field-1',
                name: 'title',
                type: 'string',
                description: 'The title',
                generated: true,
                color: '#ff0000',
            },
            {
                id: 'field-2',
                name: 'tags',
                type: 'string',
                description: 'The tags',
                generated: false,
                isArray: true,
                color: '#00ff00',
            },
        ],
    };

    describe('generatePreview', () => {
        it('should generate correct JSON preview string', () => {
            const preview = generatePreview(mockModel);
            const parsed = JSON.parse(preview);
            expect(parsed.title.type).toBe('string');
            expect(parsed.title.description).toBe('The title. (IA)');
            expect(parsed.tags.type).toBe('string');
            expect(parsed.tags.description).toBe('The tags.');
        });
    });

    describe('generateSchema', () => {
        it('should generate correct JSON schema string with added position field', () => {
            const schemaString = generateSchema(mockModel);
            const schema = JSON.parse(schemaString);

            expect(schema.type).toBe('object');
            expect(schema.properties.title.type).toBe('string');
            expect(schema.properties.tags.type).toBe('array');
            expect(schema.properties.tags.items.type).toBe('string');

            // Check for the position field which is added automatically in generateSchema
            expect(schema.properties.position).toBeDefined();
            expect(schema.properties.position.type).toBe('array');
            expect(schema.properties.position.description).toContain('{{12}}');
        });
    });
});
