import type { Page } from '@playwright/test';

/** Vue brute d'une ligne du store `annotations` (le body `tagging` porte la valeur). */
interface RawStoredAnnotation {
  id: string;
  canvasId: string;
  collectionId: string;
  type: string;
  bodies?: { purpose?: string; value?: string }[];
}

/**
 * Lecture bas niveau de la base Dexie de l'app (D-004 : assertion sobre de
 * persistance, UI d'abord). Nom de base et store lus dans
 * `src/data/repositories/indexeddb/db.ts` : base `mezanno`, store `annotations`
 * (index `&id`, clés primaires en UUID v4).
 */
export interface StoredAnnotation {
  id: string;
  canvasId: string;
  collectionId: string;
  type: string;
  value: string;
}

/**
 * Relit toutes les annotations persistées dans IndexedDB (`mezanno/annotations`)
 * depuis la page, sans dépendre de Dexie (API native `indexedDB`).
 * Retourne un tableau vide si la base ou le store n'existe pas encore.
 */
export async function readStoredAnnotations(page: Page): Promise<StoredAnnotation[]> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase | undefined>((resolve, reject) => {
      const openRequest = indexedDB.open('mezanno');
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () =>
        reject(new Error(`Ouverture de « mezanno » impossible : ${String(openRequest.error)}`));
    });
    if (database === undefined || !database.objectStoreNames.contains('annotations')) {
      database?.close();
      return [];
    }
    const annotations = await new Promise<StoredAnnotation[]>((resolve, reject) => {
      const transaction = database.transaction('annotations', 'readonly');
      const getAll = transaction.objectStore('annotations').getAll();
      getAll.onsuccess = () =>
        resolve(
          (getAll.result as RawStoredAnnotation[]).map((annotation) => ({
            id: annotation.id,
            canvasId: annotation.canvasId,
            collectionId: annotation.collectionId,
            type: annotation.type,
            // La valeur utile saisie par l'utilisateur est dans le body « tagging »
            // (le body « classifying » porte le type) — cf. createBodies.
            value: annotation.bodies?.find((body) => body.purpose === 'tagging')?.value ?? '',
          })),
        );
      getAll.onerror = () =>
        reject(
          new Error(`Lecture de « mezanno/annotations » impossible : ${String(getAll.error)}`),
        );
    });
    database.close();
    return annotations;
  });
}
