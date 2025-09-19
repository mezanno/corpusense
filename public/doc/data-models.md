# Data Models Overview

This document explains the TypeScript data models in `src/data/models/*.ts`. These types define the core entities used across Corpusense for collections, annotations, workers, results, and related concepts.

## Conventions

- `WithStringId` provides a common `{ id: string }` shape and is composed into other types.
- `*Details`, `*Content`, and combined types (e.g., `StoredManifestDetails`, `StoredManifestContent`, `StoredManifest`) separate lightweight listing metadata from heavy content payloads.
- `*CreateDTO` are input shapes for create operations.

---

## `Annotation.ts`

Represents user annotations on IIIF canvases, plus helpers to create/inspect them.

- `W3CMotivationEnum`: Subset of W3C motivations used as `body.purpose` (e.g., `classifying`, `tagging`).
- `ElementType`: Domain-specific classification for segments (TAG, ENTRY, LINE, COLUMN, PAGE, SECTION, REGION).
- `Annotation`: Extends `ImageAnnotation` with:
  - `canvasId`, `collectionId`: Scope of the annotation
  - `order`: Display order within a canvas/collection
  - optional `partOf`, `previous`, `next` chaining
- `AnnotationDTO`: Minimal persisted/transferred annotation (`ImageAnnotation` + `canvasId`, `collectionId`).
- `AnnotationCreateDTO`/`AnnotationWithIdCreateDTO`: Inputs to create an annotation from simple rect bounds and semantics.
- Type guards: `isAnnotation`, `isAnnotationArray` ensure runtime safety.
- Accessors:
  - `getBodies`, `getAnnotationText`, `getAnnotationType` and internals for reading classifying/tagging values.
- Factories:
  - `createAnnotation(params)`: Build `AnnotationDTO` from bounds, `ElementType`, and value; generates UUID if missing.
  - `createAnnotationFromAnnotorious({ annotation, type, value, collectionId, canvasId })`: Convert an Annotorious `ImageAnnotation`.
  - `duplicateAnnotation(annotation, canvasId?)`: Clone with new id and optionally switch canvas.
- Helpers:
  - `createBodies(type, value, annotationId)`: Returns two bodies: classifying and tagging.

Notes: Shapes assume rectangular geometry via `ShapeType.RECTANGLE` and encode both classifying (type) and tagging (text) bodies per annotation.

---

## `Collection.ts`

Data structures for user collections grouping canvases.

- `CollectionDetails` (extends `WithStringId`):
  - `name`, optional `about`
  - `tags: string[]` (tag ids)
  - `modelId?`: associated DataModel id
  - `contentSize`: number of elements
- `CollectionContent` (extends `WithStringId`):
  - `content: CollectionElement[]`
- `Collection`: Convenience union of details + content.
- `ExportedCollection` extends IIIF `Manifest` and adds `tags: Tag[]` for export.

---

## `CollectionElement.ts`

A single item inside a collection.

- `id?`: optional persistent id
- `canvasId`, `manifestId`, `collectionId`
- `position`: ordering index within the collection

---

## `DataModel.ts`

Describes the schema used by workers/NER to extract structured data from annotations.

- `DataField`:
  - `id`, `name`, `type`
  - `description?`, `generated?` (computed), `isArray?`
  - `color`: UI color for highlighting
- `DataModel`:
  - `id`, `name`, optional `description`, `prompt` (LLM/system prompt)
  - `fields: DataField[]`
- `DataModelCreateDTO`: Inputs for creating a model, optionally cloning from `fromModelId`.

---

## `Event.ts`

Simple app-level events.

- `EventType`: `INFO` | `ERROR`
- `Event`: `{ message: string; type: EventType }`

---

## `History.ts`

Minimal navigation history entry.

- `History`: `{ url: string }`

---

## `Metadata.ts`

Key-value metadata associated with items.

- `ItemMetadataAttribute`: `{ label: string; value: string }`
- `ItemMetadata`: `{ id: string; attribute: ItemMetadataAttribute }`

---

## `NamedEntity.ts`

Named-entity recognition (NER) results tied to annotations and word indices.

- `NamedEntitySelector`: `{ annotationId: string; indexes: number[] }`
- `NamedEntity`:
  - `id`, `dataFieldId` (refers to `DataField.id`)
  - `value` (extracted text)
  - `selector: NamedEntitySelector[]` (locations in text)
  - `annotationIds: string[]` (for IndexedDB performance)

---

## `Result.ts`

Generic worker result payload stored per scope.

- `Result`:
  - `id: number`
  - `scope: Scope`, `scopeKey: string` (for IndexedDB indexing)
  - `workerName`, `workerId`, `taskId`
  - `value: unknown` (worker-specific), `params: PluginParams`
- `ResultCreateDTO`: same minus `id`/`scopeKey` (generated server/client-side)

---

## `Scope.ts`

Discriminated union describing where an operation/result applies.

- `CollectionScope`: `{ collectionId }`
- `CanvasScope`: `{ collectionId, canvasId }`
- `AnnotationScope`: `{ collectionId, canvasId, annotationId }`
- Narrowing helpers: `isCollectionScope`, `isCanvasScope`, `isAnnotationScope`
- Comparison: `isSameScope(s1, s2)`
- Formatting: `toString(scope)`

---

## `StoredManifest.ts`

Local storage types for IIIF manifests with lightweight listings.

- `StoredManifestDetails` (extends `WithStringId`): `{ name, thumbnail? }`
- `StoredManifestContent` (extends `WithStringId`): `{ content: Manifest }`
- `StoredManifest`: union of details + manifest content

---

## `Tag.ts` and `TagCategory.ts`

Labeling system for collections/annotations.

- `Tag`: `{ id, label, category? }`
- `TagCategory`: `{ id, label, description?, tags? }`

---

## `Worker.ts`

Background processing units and their tasks.

- `WorkerStatus`: lifecycle enum (`WAITING`, `INPROGRESS`, `UNFINISHED`, `COMPLETED`, etc., with error variants)
- `Task`:
  - `id: number`
  - `canvas: Canvas`
  - `scope: CanvasScope | AnnotationScope`
  - `status: WorkerStatus`, `statusMessage?`
- `Worker`:
  - `id`, `name`, `scope`, `scopeKey`
  - `status`, `statusMessage?`, `createdAt`, `estimatedDuration`
  - `params: PluginParams`, `queue: Task[]`
- `WorkerResponse`: minimal result envelope for RPC/HTTP
- `WorkerCreateDTO`: inputs to create a worker
- Type guard `isWorker(obj)`: distinguishes saved workers from create DTOs

---

## `utils.ts`

- `WithStringId`: common `{ id: string }` alias for composing into other types.

---

## Files not covered

- `converters/` and `__tests__/` contain transformation helpers and unit tests and are not documented here.
