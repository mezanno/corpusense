import z from 'zod';

const ItemMetadataAttributeSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const ItemMetadataSchema = z.object({
  id: z.string(),
  attribute: ItemMetadataAttributeSchema,
});

export type ItemMetadata = z.infer<typeof ItemMetadataSchema>;
