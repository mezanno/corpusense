import z from 'zod';

const NamedEntitySelectorSchema = z.object({
  annotationId: z.string(),
  indexes: z.array(z.number()), // indexes of the words in the text of the annotation
});

const NamedEntitySchema = z.object({
  id: z.string(),
  dataFieldId: z.string(),
  value: z.string(),
  selector: z.array(NamedEntitySelectorSchema),
  annotationIds: z.array(z.string()),
});

export type NamedEntitySelector = z.infer<typeof NamedEntitySelectorSchema>;
export type NamedEntity = z.infer<typeof NamedEntitySchema>;
