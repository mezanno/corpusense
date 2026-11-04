import z from 'zod';

const ProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    sources: z.array(z.string()), // Array of source IDs (could be IIIF manifests or local files)
    collections: z.array(z.string()), // Array of collection IDs
  })
  .strict();

export type Project = z.infer<typeof ProjectSchema>;
