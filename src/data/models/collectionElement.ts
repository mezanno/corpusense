import z from 'zod';

// L'ordre des éléments est donné par leur position dans le tableau CollectionContent.content, il n'est plus stocké ici.
export const CollectionElementSchema = z.object({
  canvasId: z.string(),
  sourceId: z.string(),
  manifestId: z.string().optional(),
});

export type CollectionElement = z.infer<typeof CollectionElementSchema>;

/*
  LEGACY COLLECTION ELEMENT SCHEMA
  This schema is used to validate the legacy collection elements that were used in the past.
  It is kept for backward compatibility and should be removed in the future when all collections have been migrated to the new schema.
*/
export const LegacyCollectionElementSchema = z.object({
  canvasId: z.string(),
  position: z.number(),
  manifestId: z.string().optional(),
});
