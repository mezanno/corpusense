import z from 'zod';

//TODO! il va falloir utiliser un discriminant pour le type de scope, sinon on ne pourra pas faire de union type avec zod

const CollectionScopeSchema = z
  .object({
    collectionId: z.string(),
  })
  .strict();

const CanvasScopeSchema = z
  .object({
    collectionId: z.string(),
    canvasId: z.string(),
  })
  .strict();

const AnnotationScopeSchema = z
  .object({
    collectionId: z.string(),
    canvasId: z.string(),
    annotationId: z.string(),
  })
  .strict();

export const ScopeSchema = z.union([
  CollectionScopeSchema,
  CanvasScopeSchema,
  AnnotationScopeSchema,
]);

export type Scope = z.infer<typeof ScopeSchema>;
export type CollectionScope = z.infer<typeof CollectionScopeSchema>;
export type CanvasScope = z.infer<typeof CanvasScopeSchema>;
export type AnnotationScope = z.infer<typeof AnnotationScopeSchema>;
