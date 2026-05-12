import { WordRect } from '@/components/reducers/MarkupContext';
import { Annotation } from '@/data/models/Annotation';
import { DataField } from '@/data/models/DataModel';
import { NamedEntity } from '@/data/models/NamedEntity';
import { CanvasScope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getModelRepository,
  getNamedEntityLiveRepository,
  getNamedEntityRepository,
  getResultRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { generateNamedEntity } from '@/data/utils/namedEntity';
import { useAppDispatch } from '@/hooks/hooks';
import { pushError } from '@/state/reducers/events';
import { useLiveQuery } from 'dexie-react-hooks';
import { uniq } from 'lodash';
import { useMemo } from 'react';
import { v4 as uuid } from 'uuid';

export interface AddEntityPayload {
  rects: WordRect[];
  type: DataField;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number');
}

const useNamedEntities = (annotationIds: string[]) => {
  const appDisptach = useAppDispatch();
  const namedEntityLiveRepository = useMemo(getNamedEntityLiveRepository, []);
  const namedEntityRepository = useMemo(getNamedEntityRepository, []);

  const namedEntities = useLiveQuery(
    namedEntityLiveRepository.getByAnnotationIds(annotationIds),
    [namedEntityLiveRepository, annotationIds],
    [] as NamedEntity[],
  );

  /**
   * Load entities of a given scope. If no result or no model is found,
   * @param scope
   * @returns
   */
  const loadEntities = async (scope: CanvasScope) => {
    const resultRepository = getResultRepository();
    const result = await resultRepository.getByScopeAndWorkerName(
      scope,
      'mistral', //TODO! paramétrer le worker
    );
    const { value } = result;

    let model = undefined;
    const collectionRepository = getCollectionRepository();
    try {
      //get the collection, its content and the model
      const collection = await collectionRepository.getById(scope.collectionId);
      const modelId = collection.modelId;
      if (modelId === undefined) {
        appDisptach(pushError('error_model_undefined'));
        return;
      }
      const modelRepository = getModelRepository();
      model = await modelRepository.getById(modelId);
    } catch (error) {
      appDisptach(pushError('error_model_undefined'));
      return;
    }

    //get all the annotations of the canvas
    const annotationRepository = getAnnotationRepository();
    const annotations = await annotationRepository.getByScope(scope);

    //parse the result value and for each value, create a named entity if possible
    const dataParsed = JSON.parse(value as string) as unknown;
    const dataParsedArray = (Array.isArray(dataParsed) ? dataParsed : [dataParsed]) as unknown[];
    const entities: NamedEntity[] = [];
    dataParsedArray.forEach((item) => {
      if (
        item !== undefined &&
        item !== null &&
        typeof item === 'object' &&
        'position' in item &&
        isNumberArray(item.position)
      ) {
        const positions = item.position;
        const annotationsForItem: Annotation[] = annotations.filter((_, index) =>
          positions.includes(index),
        );
        model.fields.forEach((field) => {
          if (
            typeof item === 'object' &&
            item !== null &&
            field.name in (item as Record<string, unknown>)
          ) {
            const itemValue = (item as Record<string, unknown>)[field.name] as string;
            entities.push(generateNamedEntity(field, itemValue, annotationsForItem));
          }
        });
      }
    });
    // yield put(loadEntitiesSuccess(entities));
  };

  const addEntity = async (payload: AddEntityPayload) => {
    const { rects, type } = payload;
    const newNamedEntity = {
      id: uuid(),
      dataFieldId: type.id,
      value: rects.map((rect) => rect.word).join(' '),
      selector: rects.reduce(
        (selectors, rect) => {
          const se = selectors.find((s) => s.annotationId === rect.annotationId);
          if (se) {
            se.indexes.push(rect.annotationWordIndex);
          } else {
            selectors.push({
              annotationId: rect.annotationId,
              indexes: [rect.annotationWordIndex],
            });
          }
          return selectors;
        },
        [] as NamedEntity['selector'],
      ),
      annotationIds: uniq(rects.map((rect) => rect.annotationId)),
    };
    await namedEntityRepository.add(newNamedEntity);
  };

  return {
    namedEntities,
    addEntity,
    loadEntities,
  };
};

export default useNamedEntities;
