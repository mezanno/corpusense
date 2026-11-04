import { Manifest } from '@iiif/presentation-3';
import z from 'zod';

const SourceTypeSchema = z.enum(['local', 'remote']);

const StoredBlobSchema = z
  .object({
    id: z.string(),
    blob: z.instanceof(Blob),
  })
  .strict();

export type StoredBlob = z.infer<typeof StoredBlobSchema>;

const SourceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: SourceTypeSchema,
    pageCount: z.number().int().nonnegative(),
    thumbnailBlobId: z.string(),
  })
  .strict();

export type Source = z.infer<typeof SourceSchema>;

export const ManifestSchema = z.custom<Manifest>();

export const LocalFileSchema = z
  .object({
    outputDirectoryHandle: z.instanceof(FileSystemDirectoryHandle),
    timestamp: z.number(),
    manifestName: z.string(),
    folderName: z.string(),
  })
  .strict();

const SourceContentSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('remote'),
    manifest: ManifestSchema,
  }),

  z.object({
    id: z.string(),
    type: z.literal('local'),
    manifest: ManifestSchema,
    localFile: LocalFileSchema,
    githubManifestUrl: z.string().optional(),
  }),
]);

export type SourceContent = z.infer<typeof SourceContentSchema>;

const SourceWithContentSchema = SourceSchema.extend({
  content: SourceContentSchema,
});

export type SourceWithContent = z.infer<typeof SourceWithContentSchema>;

export const SourceWithContentAndThumbnailSchema = SourceWithContentSchema.extend({
  thumbnailBase64: z.string(),
});

export type SourceWithContentAndThumbnail = z.infer<typeof SourceWithContentAndThumbnailSchema>;
