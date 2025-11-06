import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { CanvasScope } from '@/data/models/Scope';
import { setOcrStatus } from '@/state/reducers/collections';
import { AppDispatch, RootState } from '@/state/store';
import { ICreateChange, IDatabaseChange, IDeleteChange, IUpdateChange } from 'dexie-observable/api';
import { db } from './db';
import { getAnnotationRepository } from './dbFactory';

/*
  WIP: IndexedDB synchronization by listening to database changes
  and updating the application state accordingly.
*/

export function initIndexedDBSync(getState: () => RootState, dispatch: AppDispatch) {
  /*
    changes contient toutes les opérations au sein d'une même transaction
    --> il faut donc les considérer dans leur ordre d'arriver et par groupes cohérents (ie par table/type d'opération)
    */
  db.on('changes', (changes) => {
    logChanges(changes);
    void processChanges(changes, getState, dispatch);
  });
}

const logChanges = (changes: IDatabaseChange[]) => {
  for (const change of changes) {
    const { table, type } = change;
    let c;
    switch (type as number) {
      case 1: // CREATED
        c = change as ICreateChange;
        console.log(`CREATE in ${table}: `, c.obj);
        break;
      case 2: // UPDATED
        c = change as IUpdateChange;
        console.log(`UPDATE in ${table} (${change.key}): `, c.mods);
        console.log(change);
        break;
      case 3: // DELETED
        c = change as IDeleteChange;
        console.log(`DELETE in ${table}: `, c.oldObj);
        break;
    }
  }
};

const processChanges = async (
  changes: IDatabaseChange[],
  getState: () => RootState,
  dispatch: AppDispatch,
) => {
  const changesGroups = changes.reduce((groups: IDatabaseChange[][], change) => {
    const lastGroup = groups[groups.length - 1];
    //if the previous group is of the same table and type, add to the group
    if (
      lastGroup !== undefined &&
      lastGroup[0].table === change.table &&
      lastGroup[0].type === change.type
    ) {
      lastGroup.push(change);
    } else {
      //else, create a new group
      groups.push([change]);
    }
    return groups;
  }, []);
  for (const group of changesGroups) {
    try {
      await handleGroupOfChanges(group, getState, dispatch);
    } catch (error) {
      console.error('Error handling group of changes: ', error);
    }
  }
};

const handleGroupOfChanges = async (
  changes: IDatabaseChange[],
  getState: () => RootState,
  dispatch: AppDispatch,
) => {
  const { table, type } = changes[0];
  //   console.log(`Handling group of changes in table ${table} of type ${type}: `, changes);
  if (table === 'annotations') {
    //get the current loaded collection from the store
    const loadedCollectionId = getState().collections.currentCollection?.id;
    //compute the scopes affected by these deletions
    const scopesMap = new Map<string, { collectionId: string; canvasId: string }>();
    switch (type as number) {
      case 1: // CREATED
        break;
      case 2: // UPDATED
        for (const c of changes) {
          const updatedAnnotation = (c as IUpdateChange).obj as Annotation;
          const outDatedAnnotation = (c as IUpdateChange).oldObj as Annotation;
          //if the type of the annotation changed to or from TEXT_LINE, we need to update the OCR status
          if (
            (getAnnotationType(updatedAnnotation) === ElementType.TEXT_LINE &&
              getAnnotationType(outDatedAnnotation) !== ElementType.TEXT_LINE) ||
            (getAnnotationType(updatedAnnotation) !== ElementType.TEXT_LINE &&
              getAnnotationType(outDatedAnnotation) === ElementType.TEXT_LINE)
          ) {
            const key = `${updatedAnnotation.collectionId}-${updatedAnnotation.canvasId}`;
            if (!scopesMap.has(key)) {
              scopesMap.set(key, {
                collectionId: updatedAnnotation.collectionId,
                canvasId: updatedAnnotation.canvasId,
              });
            }
          }
        }
        break;
      case 3: // DELETED
        for (const c of changes) {
          const a = (c as IDeleteChange).oldObj as Annotation;
          if (loadedCollectionId !== undefined && a.collectionId !== loadedCollectionId) {
            continue;
          }
          const key = `${a.collectionId}-${a.canvasId}`;
          if (!scopesMap.has(key)) {
            scopesMap.set(key, {
              collectionId: a.collectionId,
              canvasId: a.canvasId,
            });
          }
        }
    }

    const scopes = Array.from(scopesMap.values());
    await updateOcrStatusForCanvas(scopes, dispatch);
  }
};

const updateOcrStatusForCanvas = async (scopes: CanvasScope[], dispatch: AppDispatch) => {
  //for each scope, check if there is at least one annotation of type TEXT_LINE to set the ocr status to true
  const hasOcrMap = new Map<string, boolean>();
  const annotationRespository = getAnnotationRepository();
  for (const scope of scopes) {
    const annotations = await annotationRespository.getByScopeAndTypes(scope, [
      ElementType.TEXT_LINE,
    ]);
    hasOcrMap.set(scope.canvasId, annotations.length > 0);
  }
  dispatch(setOcrStatus(Object.fromEntries(hasOcrMap)));
};
