import { words } from 'lodash';
import { v4 as uuid } from 'uuid';
import { Annotation, getAnnotationText } from '../models/Annotation';
import { DataField } from '../models/DataModel';
import { NamedEntity, NamedEntitySelector } from '../models/NamedEntity';

const computeSelector = (
  namedEntityValue: string,
  annotations: Annotation[],
): NamedEntitySelector[] => {
  const neWords = words(namedEntityValue);
  console.log(neWords);

  /*
  for each word in neWords, find the annotation and the index of the word in the annotation
  */
  const selectors: NamedEntitySelector[] = [];
  for (const annotation of annotations) {
    const annotationWords = words(getAnnotationText(annotation));
    const indexes: number[] = [];
    //TODO! on peut optimiser en sortant de la boucle si on a trouvé tous les mots (on devrait faire un pop sur neWords)
    neWords.forEach((word) => {
      const index = annotationWords.indexOf(word);
      if (index !== -1) {
        indexes.push(index);
      }
    });
    selectors.push({ annotationId: annotation.id, indexes });
  }
  return selectors;
};

const generateNamedEntity = (
  type: DataField,
  value: string,
  annotations: Annotation[],
): NamedEntity => {
  const selector = computeSelector(value, annotations);
  return {
    id: uuid(),
    dataFieldId: type.id,
    value,
    selector,
    annotationIds: selector.map((s) => s.annotationId),
  };
};

export { computeSelector, generateNamedEntity };
