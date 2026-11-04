import z from 'zod';
import { AnnotationDTO } from '../annotations/annotation.dto';
import { CollectionElementSchema, LegacyCollectionElementSchema } from '../collectionElement';
import { DataModelSchema } from '../dataModel/dataModel';
import { ObjectWithStringIdSchema } from '../objectWithStringId';
import { ResultSchema } from '../result/result';
import { SourceWithContentAndThumbnailSchema } from '../source/source';
import { TagSchema } from '../tag';
import { TimeStampSchema } from '../timeStampSchema';
import { WorkerSchema } from '../worker/worker';

const CollectionDetailsSchema = TimeStampSchema.extend({
  name: z.string(),
  about: z.string().optional(),
  tags: z.array(z.string()),
  modelId: z.string().optional(),
  contentSize: z.number(),
  postLayoutModifierChainId: z.string().optional(),
  postOcrModifierChainId: z.string().optional(),
});

export type CollectionDetails = z.infer<typeof CollectionDetailsSchema>;

const CollectionContentSchema = ObjectWithStringIdSchema.extend({
  content: z.array(CollectionElementSchema),
});

export type CollectionContent = z.infer<typeof CollectionContentSchema>;

export const CollectionSchema = CollectionDetailsSchema.extend(CollectionContentSchema.shape);

export type Collection = z.infer<typeof CollectionSchema>;

export const ExportedCollectionSchema = z.object({
  collection: CollectionSchema,
  sources: z.array(SourceWithContentAndThumbnailSchema),
  tags: z.array(TagSchema).optional(),
  annotations: z.array(z.custom<AnnotationDTO>()).optional(),
  model: DataModelSchema.optional(),
  workers: z.array(WorkerSchema).optional(),
  results: z.array(ResultSchema).optional(),
});

export type ExportedCollection = z.infer<typeof ExportedCollectionSchema>;

/*
  LEGACY COLLECTION SCHEMA
  This schema is used to validate the legacy collection that were used in the past.
  It is kept for backward compatibility and should be removed in the future when all collections have been migrated to the new schema.
*/
const LegacyCollectionContentSchema = ObjectWithStringIdSchema.extend({
  content: z.array(LegacyCollectionElementSchema),
});

const LegacyCollectionSchema = CollectionDetailsSchema.extend(LegacyCollectionContentSchema.shape);

export const LegacyExportedCollectionSchema = z.object({
  collection: LegacyCollectionSchema,
  tags: z.array(TagSchema).optional(),
  annotations: z.array(z.custom<AnnotationDTO>()).optional(),
  model: DataModelSchema.optional(),
  workers: z.array(WorkerSchema).optional(),
  results: z.array(ResultSchema).optional(),
});

export type LegacyExportedCollection = z.infer<typeof LegacyExportedCollectionSchema>;
