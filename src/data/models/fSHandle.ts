import z from 'zod';

const FSHandleSchema = z.object({
  id: z.string(),
  handle: z.instanceof(FileSystemDirectoryHandle),
});

export type FSHandle = z.infer<typeof FSHandleSchema>;
