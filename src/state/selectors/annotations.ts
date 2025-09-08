import { Annotation, ElementType, getAnnotationType } from '@/data/models/Annotation';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

const selectAnnotations = (state: RootState) => state.annotations.values ?? [];

const selectAnnotationType = (_: RootState, annotationType: ElementType) => annotationType;

const getAnnotationsByType = createSelector(
  [selectAnnotations, selectAnnotationType],
  (annotations, annotationType): Annotation[] => {
    return annotations
      .filter((a) => getAnnotationType(a) === annotationType)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },
);

const selectCurrentScope = (state: RootState) => state.annotations.currentScope;

const selectLastOrderByType = createSelector([getAnnotationsByType], (annotations): number => {
  if (annotations.length === 0) {
    return 1;
  }
  return annotations[annotations.length - 1].order ?? 1;
});

export { getAnnotationsByType, selectAnnotations, selectCurrentScope, selectLastOrderByType };
