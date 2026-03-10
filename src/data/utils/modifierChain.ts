import { AnyModifier } from '@/data/models/modifiers/Modifier';
import { modifierRegistry } from '@/data/models/modifiers/ModifierFactory';
import { CanvasScope, CollectionScope, isCanvasScope } from '@/data/models/Scope';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getModifierChainRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { Annotation, ElementType } from '../models/Annotation';

export type ModifierChainData = {
  modifiers: AnyModifier[];
  modifierValues: Record<string, unknown>;
  name?: string;
};

const getModifiersAndValues = async (id: string): Promise<ModifierChainData> => {
  const modifierChainRepository = getModifierChainRepository();
  const modifierDTO = await modifierChainRepository.getById(id);

  const modifiers = modifierDTO.modifiers.map((dto) => {
    const factory = modifierRegistry[dto.type];
    if (factory === undefined || factory === null) {
      throw new Error(`No factory found for modifier type: ${dto.type}`);
    }
    const modifier = factory.create();
    modifier.id = dto.id; // Assigner l'ID du DTO au modifier créé
    return modifier;
  });

  const modifierValues: Record<string, unknown> = {};
  modifierDTO.modifiers.forEach((dto) => {
    modifierValues[dto.id] = dto.values;
  });

  return { modifiers, modifierValues, name: modifierDTO.name };
};

const applyModifiersToScope = async (
  modifiers: AnyModifier[],
  values: Record<string, unknown>,
  scope: CollectionScope | CanvasScope,
  type: ElementType,
) => {
  if (modifiers.length === 0) return;

  const annotationRepository = getAnnotationRepository();

  if (isCanvasScope(scope)) {
    const scopeAnnotations = await annotationRepository.getByScopeAndTypes(scope, [type]);
    if (scopeAnnotations.length === 0) return;
    const updatedAnnotations = applyChainToAnnotations(modifiers, values, scopeAnnotations);
    await annotationRepository.deleteByIds(scopeAnnotations.map((a) => a.id));
    await annotationRepository.addAll(updatedAnnotations);
  } else {
    //for collection scope, we get the annotations for each canvas, apply the modifier chain and save the updated annotations
    const collectionRepository = getCollectionRepository();
    const canvases = await collectionRepository.getCanvasesByCollectionId(scope.collectionId);
    for (const canvas of canvases) {
      const canvasScope = { collectionId: scope.collectionId, canvasId: canvas.id };
      const scopeAnnotations = await annotationRepository.getByScopeAndTypes(canvasScope, [type]);
      if (scopeAnnotations.length === 0) continue;
      const updatedAnnotations = applyChainToAnnotations(modifiers, values, scopeAnnotations);
      await annotationRepository.deleteByIds(scopeAnnotations.map((a) => a.id));
      await annotationRepository.addAll(updatedAnnotations);
    }
  }
};

const applyModifierChainToAnnotations = async (
  modifierChainId: string,
  annotations: Annotation[],
) => {
  try {
    const { modifiers, modifierValues } = await getModifiersAndValues(modifierChainId);
    return applyChainToAnnotations(modifiers, modifierValues, annotations);
  } catch (error) {
    console.error(`Error applying modifier chain with id "${modifierChainId}":`, error);
    return annotations;
  }
};

const applyChainToAnnotations = (
  modifiers: AnyModifier[],
  modifierValues: Record<string, unknown>,
  annotations: Annotation[],
) => {
  let updatedAnnotations = [...annotations];
  modifiers.forEach((modifier) => {
    const values = modifierValues[modifier.id];
    if (values !== undefined) {
      const rawValues = modifierValues[modifier.id] ?? {};
      const parsedValues = modifier.schema.parse(rawValues);
      updatedAnnotations = modifier.apply(updatedAnnotations, parsedValues);
    }
  });
  return updatedAnnotations;
};

export { applyModifierChainToAnnotations, applyModifiersToScope, getModifiersAndValues };
