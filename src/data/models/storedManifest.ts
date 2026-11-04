import { ContentResource, Manifest } from '@iiif/presentation-3';
import z from 'zod';
import { ObjectWithStringIdSchema } from './objectWithStringId';

const ManifestSchema = z.custom<Manifest>();
const ContentResourceSchema = z.custom<ContentResource>();

const StoredManifestDetailsSchema = ObjectWithStringIdSchema.extend({
  name: z.string(),
  thumbnail: ContentResourceSchema.optional(),
});

const StoredManifestContentSchema = ObjectWithStringIdSchema.extend({
  content: ManifestSchema,
});

export type StoredManifestDetails = z.infer<typeof StoredManifestDetailsSchema>;
export type StoredManifestContent = z.infer<typeof StoredManifestContentSchema>;
