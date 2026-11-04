import i18n from '@/i18n';
import { BaseError } from '@/utils/BaseError';

export class EmptyCollectionError extends BaseError {
  constructor(context: { id: string; name: string }) {
    super(`Collection ${context.name} (${context.id}) is empty`);
  }
}

export class DBError extends BaseError {
  constructor(context: { message: string }) {
    super(`Database error: ${context.message}`);
  }
}

export class SourceAlreadyInProjectError extends BaseError {
  constructor(context: { projectId: string; sourceId: string }) {
    super(`Source ${context.sourceId} already exists in project ${context.projectId}`, {
      context,
    });
  }
}

// Erreurs levées par les command utils (src/data/utils) : elles remontent aux
// sagas/boundaries qui les capturent et les rapportent. Messages portés par la
// classe pour rester traduits là où ils étaient affichés tels quels aujourd'hui.

export class InvalidBase64Error extends BaseError {
  constructor(context: { reason?: string } = {}) {
    super('Invalid base64 string', { context });
  }
}

export class InvalidModelStructureError extends BaseError {
  constructor(context: { issues?: string } = {}) {
    super('Invalid model structure', { context });
  }
}

export class InvalidManifestError extends BaseError {
  constructor(context: { manifestId?: string } = {}) {
    super(i18n.t('error_invalid_manifest_input'), { context });
  }
}

export class CanvasNotFoundError extends BaseError {
  constructor(context: { canvasId: string }) {
    super(i18n.t('error_canvas_not_found'), { context });
  }
}

export class MissingCanvasImageError extends BaseError {
  constructor(context: { canvasId: string }) {
    super(i18n.t('error_image_not_found'), { context });
  }
}

export class MissingImageDimensionsError extends BaseError {
  constructor(context: { canvasId: string }) {
    super(i18n.t('error_image_dimensions'), { context });
  }
}

export class MalformedFilepathError extends BaseError {
  constructor(context: { filepath: string }) {
    super(i18n.t('error_malformed_filepath', { path: context.filepath }), { context });
  }
}

export class FilePermissionDeniedError extends BaseError {
  constructor(context: { directory: string }) {
    super(`No permission to read the directory ${context.directory}`, { context });
  }
}

export class NothingToMergeError extends BaseError {
  constructor(context: { type?: string } = {}) {
    super('No annotations to merge', { context });
  }
}

export class ResultConversionError extends BaseError {
  constructor(context: { resultId: number; reason: string }) {
    super(`Result conversion failed for result ${context.resultId}: ${context.reason}`, {
      context,
    });
  }
}

export class UnknownModifierTypeError extends BaseError {
  constructor(context: { type: string }) {
    super(`No factory found for modifier type: ${context.type}`, { context });
  }
}
