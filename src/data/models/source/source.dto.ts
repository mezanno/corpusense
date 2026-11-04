import z from 'zod';
import { LocalFileSchema, ManifestSchema } from './source';

const AddSourceDTOSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('remote'),
    name: z.string(),
    pageCount: z.number().int().nonnegative(),
    thumbnailBlob: z.instanceof(Blob),
    manifest: ManifestSchema,
  }),

  z.object({
    type: z.literal('local'),
    name: z.string(),
    pageCount: z.number().int().nonnegative(),
    thumbnailBlob: z.instanceof(Blob),
    manifest: ManifestSchema,
    localFile: LocalFileSchema,
  }),
]);

export type AddSourceDTO = z.infer<typeof AddSourceDTOSchema>;
