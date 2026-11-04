import { getAnnotationRepository } from '@/data/repositories/indexeddb/dbFactory';
import {
  getDimensions,
  getDistanceBetweenAnnotationCenters,
  getLeft,
  mergeTwoAnnotations,
} from '@/data/utils/annotations';
import i18n from '@/i18n';
import { Bounds } from '@annotorious/annotorious';
import { v4 as uuid } from 'uuid';
import z from 'zod';
import { Annotation } from '../annotations/annotation';
import { Modifier } from './Modifier';

const mergeSchema = z.object({
  origin: z.enum(['center', 'bordure']).default('center'),
  verticalThreshold: z.number().min(-1).default(-1),
  horizontalThreshold: z.number().min(-1).default(-1),
});

export class MergeModifier extends Modifier<typeof mergeSchema> {
  type = 'MergeModifier';
  readonly verticalThresholdMax: number;
  readonly horizontalThresholdMax: number;

  constructor(verticalThresholdMax: number, horizontalThresholdMax: number) {
    super(
      uuid(),
      'MergeModifier',
      mergeSchema,
      {
        origin: {
          label: i18n.t('form_label_modifier_merge_origin'),
          description: i18n.t('form_description_modifier_merge_origin'),
          options: ['center', 'bordure'],
        },
        verticalThreshold: {
          label: i18n.t('form_label_modifier_merge_vertical'),
          description: i18n.t('form_description_modifier_merge_vertical'),
          min: -1,
          max: verticalThresholdMax,
          step: 1,
        },
        horizontalThreshold: {
          label: i18n.t('form_label_modifier_merge_horizontal'),
          description: i18n.t('form_description_modifier_merge_horizontal'),
          min: -1,
          max: horizontalThresholdMax,
          step: 1,
        },
      },
      i18n.t('form_description_modifier_merge'),
    );
    this.verticalThresholdMax = verticalThresholdMax;
    this.horizontalThresholdMax = horizontalThresholdMax;
  }

  apply = (data: Annotation[], values: z.infer<typeof mergeSchema>) => {
    if (data.length <= 1) return data;

    const { origin, verticalThreshold, horizontalThreshold } = mergeSchema.parse(values);

    const verticalActive = verticalThreshold >= 0;
    const horizontalActive = horizontalThreshold >= 0;

    if (!verticalActive && !horizontalActive) return data;

    const annotations = [...data];

    annotations.sort(
      (a, b) => a.target.selector.geometry.bounds.minY - b.target.selector.geometry.bounds.minY,
    );

    const getBounds = (a: Annotation) => a.target.selector.geometry.bounds;
    const overlap = (aMin: number, aMax: number, bMin: number, bMax: number) =>
      Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));

    if (origin === 'center') {
      return this.applyToCenters(
        annotations,
        values,
        getBounds,
        overlap,
        verticalActive,
        horizontalActive,
      );
    } else {
      return this.applyToBorders(
        annotations,
        values,
        getBounds,
        overlap,
        verticalActive,
        horizontalActive,
      );
    }
  };

  applyToCenters = async (
    annotations: Annotation[],
    values: z.infer<typeof mergeSchema>,
    getBounds: (a: Annotation) => Bounds,
    overlap: (aMin: number, aMax: number, bMin: number, bMax: number) => number,
    verticalActive: boolean,
    horizontalActive: boolean,
  ) => {
    const { verticalThreshold, horizontalThreshold } = mergeSchema.parse(values);

    const annotationRepository = getAnnotationRepository();

    //we fetch all parents before the loop to avoid fetching them multiple times (and also to speed up the process since we can do it in parallel)
    //on ne paut pas utiliser ElementType.TEXT_LINE puisque les previews se font avec ElementType.TEMP
    //mais de toute façon, seuls les ElementType.TEXT_LINE ont un parent.
    // if (
    //   getAnnotationType(a) === getAnnotationType(b) &&
    //   getAnnotationType(a) === ElementType.TEXT_LINE
    // ) {
    const parents = new Map<string, Annotation | null>();
    await Promise.all(
      annotations.map(async (a) => {
        const result = await annotationRepository.getParent(a);
        if (result.ok) {
          parents.set(a.id, result.value);
        } else {
          parents.set(a.id, null);
        }
      }),
    );

    //we sort the annotations by their center Y coordinate to speed up the process (we will only compare annotations that are close to each other vertically)
    annotations.sort((a, b) => getBounds(a).minY - getBounds(b).minY);

    let changed = true;
    while (changed) {
      changed = false;

      for (let i = 0; i < annotations.length; i++) {
        for (let j = i + 1; j < annotations.length; j++) {
          const a = annotations[i];
          const b = annotations[j];

          const aB = getBounds(a);
          const bB = getBounds(b);

          if (bB.minY - aB.maxY > verticalThreshold) {
            break; //since the annotations are sorted by their minY, if the distance between a and b is greater than the vertical threshold, it will be greater for all the next annotations
          }

          const parentA = parents.get(a.id);
          const parentB = parents.get(b.id);

          if (
            parentA !== null &&
            parentA !== undefined &&
            parentB !== null &&
            parentB !== undefined &&
            parentA.id !== parentB.id
          ) {
            continue; // ne pas merger des annotations qui n'ont pas le même parent
          }

          const distance = getDistanceBetweenAnnotationCenters(a, b);
          const verticalOk = !verticalActive || Math.abs(distance.vertical) <= verticalThreshold;

          const horizontalOk =
            !horizontalActive || Math.abs(distance.horizontal) <= horizontalThreshold;

          const verticalOverlap = overlap(aB.minY, aB.maxY, bB.minY, bB.maxY);
          const horizontalOverlap = overlap(aB.minX, aB.maxX, bB.minX, bB.maxX);

          if (verticalOk && horizontalOk && (verticalOverlap > 0 || horizontalOverlap > 0)) {
            if (getLeft(a) < getLeft(b)) {
              annotations[i] = mergeTwoAnnotations(a, b);
            } else {
              annotations[i] = mergeTwoAnnotations(b, a);
            }

            annotations.splice(j, 1);
            changed = true;
            break;
          }
        }

        if (changed) break;
      }
    }

    return annotations;
  };

  applyToBorders = (
    annotations: Annotation[],
    values: z.infer<typeof mergeSchema>,
    getBounds: (a: Annotation) => Bounds,
    overlap: (aMin: number, aMax: number, bMin: number, bMax: number) => number,
    verticalActive: boolean,
    horizontalActive: boolean,
  ) => {
    const { verticalThreshold, horizontalThreshold } = mergeSchema.parse(values);
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < annotations.length; i++) {
        for (let j = i + 1; j < annotations.length; j++) {
          const a = annotations[i];
          const b = annotations[j];

          const aB = getBounds(a);
          const bB = getBounds(b);

          const verticalDistance = Math.max(0, Math.max(aB.minY - bB.maxY, bB.minY - aB.maxY));
          const horizontalDistance = Math.max(0, Math.max(aB.minX - bB.maxX, bB.minX - aB.maxX));

          const verticalOverlap = overlap(aB.minY, aB.maxY, bB.minY, bB.maxY);
          const horizontalOverlap = overlap(aB.minX, aB.maxX, bB.minX, bB.maxX);

          const dimensionA = getDimensions(a);
          const dimensionB = getDimensions(b);

          const verticalOverlapRatio =
            verticalOverlap / Math.min(dimensionA.height, dimensionB.height);

          const horizontalOverlapRatio =
            horizontalOverlap / Math.min(dimensionA.width, dimensionB.width);

          const horizontalMerge =
            horizontalActive &&
            horizontalDistance <= horizontalThreshold &&
            verticalOverlapRatio > 0.3;

          const verticalMerge =
            verticalActive && verticalDistance <= verticalThreshold && horizontalOverlapRatio > 0.3;

          if (horizontalMerge || verticalMerge) {
            annotations[i] = mergeTwoAnnotations(a, b);

            annotations.splice(j, 1);
            changed = true;
            break;
          }
        }

        if (changed) break;
      }
    }
    return annotations;
  };
}
