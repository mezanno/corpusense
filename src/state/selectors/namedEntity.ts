import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const getEntitiesByAnnotationId = createSelector(
  [(state: RootState) => state.entities, (_: RootState, annotationId: string) => annotationId],
  (entities, annotationId) => entities.filter((e) => e.annotationIds.includes(annotationId)),
);

export const getEntities = (state: RootState) => state.entities;
