import z from 'zod';
import { CollectionSchema } from './collection';

const CollectionCreateSchema = CollectionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CollectionCreateDTO = z.infer<typeof CollectionCreateSchema>;
