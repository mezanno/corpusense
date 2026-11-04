import i18n from '@/i18n';
import { BaseError, Jsonable } from '@/utils/BaseError';

/*
 * Erreurs de la frontière plugins (importers IIIF et workers distants).
 *
 * Frontière externe assumée (cf. docs/DECISIONS.md, D-002) : HTTP et APIs LLM
 * sont des incidents non traitables à l'appel, donc l'exception est l'idiome naturel. Elles ne
 * sont jamais levées au-dessus du boundary qui les capture une seule fois :
 * - importers  → `utils/manifest.fetchManifestFromURL` (convertit en `ManifestFetchError`)
 * - workers    → `sagas/workers.startWorker` (convertit en statut de tâche ERROR)
 * - results    → `hooks/useJobRealtime` (convertit en statut de tâche ERROR)
 *
 * Toutes portent un contexte JSON typé nommant le job fautif (plugin, tâche, URL) : le message,
 * lui, reste ce que l'utilisateur lit dans le statut persisté ; le contexte, c'est pour les logs.
 */

/** Contexte commun aux erreurs émises par un plugin : de quoi retrouver le job dans la file. */
export type PluginErrorContext = {
  plugin: string;
  taskId?: number;
  [key: string]: Jsonable;
};

const MAX_BODY_LENGTH = 300;

const shorten = (body: string): string =>
  body.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH)}…` : body;

// — Importers : la réponse HTTP d'un manifeste distant -----------------------

export class ManifestNotFoundError extends BaseError {
  constructor(context: { url: string }) {
    super(i18n.t('error_404_manifest', { url: context.url }), { context });
  }
}

export class ManifestForbiddenError extends BaseError {
  constructor(context: { url: string }) {
    super(i18n.t('error_403_manifest', { url: context.url }), { context });
  }
}

export class ManifestHttpError extends BaseError {
  constructor(context: { url: string; status: number; statusText: string }) {
    super(
      i18n.t('error_loading_manifest', {
        error: `${context.status} ${context.statusText}`,
      }),
      { context },
    );
  }
}

export class RemoteManifestInvalidError extends BaseError {
  constructor(context: { url: string }) {
    super(i18n.t('error_invalid_manifest', { url: context.url }), { context });
  }
}

/**
 * Englobe une échec d'import qui n'a pas de classe à lui (réseau coupé, JSON illisible…).
 * Le message d'origine est conservé dans `cause` : un boundary ne doit jamais le remplacer
 * par un « erreur inconnue » qui ne dit plus rien de ce qui a manqué.
 */
export class ManifestImportError extends BaseError {
  constructor(context: { url: string; cause: string }) {
    super(`Manifest import failed for ${context.url}: ${context.cause}`, {
      context,
      cause: context.cause,
    });
  }
}

/**
 * Fabrique l'erreur attendue pour une réponse HTTP non valide, selon le code reçu.
 * Un seul endroit traduit un statut HTTP en mode d'échec nommé : les importers n'ont
 * plus à dupliquer la chaîne de branches 404 / 403 / autre.
 */
export function manifestHttpError(
  url: string,
  response: { status: number; statusText: string },
): ManifestNotFoundError | ManifestForbiddenError | ManifestHttpError {
  const { status, statusText } = response;
  if (status === 404) return new ManifestNotFoundError({ url });
  if (status === 403) return new ManifestForbiddenError({ url });
  return new ManifestHttpError({ url, status, statusText });
}

// — Workers : ce que le service distant a répondu ----------------------------

export class PluginApiError extends BaseError {
  constructor(context: { plugin: string; status: number; statusText: string; body: string }) {
    super(
      `${context.plugin} request failed (${context.status} ${context.statusText}): ${shorten(context.body)}`,
      { context },
    );
  }
}

export class PluginResponseValidationError extends BaseError {
  constructor(context: { plugin: string; details: string }) {
    super(`${context.plugin} response validation failed: ${context.details}`, { context });
  }
}

/** Le scope d'une tâche n'est pas celui que le plugin sait traiter. */
export class InvalidTaskScopeError extends BaseError {
  constructor(context: PluginErrorContext & { scope: string }) {
    super(i18n.t('error_task_invalid_scope'), { context });
  }
}

// — Bridge Supabase (Job posting) -------------------------------------------

export class MissingImageIdError extends BaseError {
  constructor(context: { canvasId: string; sourceId: string }) {
    super(`Canvas ${context.canvasId} (source ${context.sourceId}) has no image id to upload`, {
      context,
    });
  }
}

export class RemoteImageFetchError extends BaseError {
  constructor(context: { url: string; status: number }) {
    super(`Failed to fetch image ${context.url} (status ${context.status})`, { context });
  }
}

export class SupabaseStorageError extends BaseError {
  constructor(context: { action: 'upload' | 'delete'; filePath: string; cause: string }) {
    super(`Failed to ${context.action} ${context.filePath} on Supabase storage: ${context.cause}`, {
      context,
      cause: context.cause,
    });
  }
}

/**
 * Échec du pont D6 : le Job n'a pas pu être posté chez le service distant, la tâche ne
 * sera donc jamais bridée vers un statut POSTED. Le message nomme le plugin, le worker et
 * la tâche, parce que c'est exactement ce que le statut persisté a besoin de dire.
 */
export class JobPostError extends BaseError {
  constructor(context: PluginErrorContext & { workerId: string; cause: string }) {
    super(
      `${context.plugin} could not post job for task ${context.taskId} of worker ${context.workerId}: ${context.cause}`,
      { context, cause: context.cause },
    );
  }
}
