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

export { getAnnotationsByType, selectAnnotations };
