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
import { Annotation } from '../Annotation';
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

  // apply = (data: Annotation[], values: z.infer<typeof mergeSchema>) => {
  //   console.log('Applying MergeModifier with values: ', values);
  //   if (data.length > 1) {
  //     const {
  //       origin,
  //       verticalThreshold: defaultVerticalThreshold,
  //       horizontalThreshold: defaultHorizontalThreshold,
  //     } = mergeSchema.parse(values);
  //     const verticalThreshold = values.verticalThreshold ?? defaultVerticalThreshold;
  //     const horizontalThreshold = values.horizontalThreshold ?? defaultHorizontalThreshold;
  //     console.log('Using values ', verticalThreshold, '|', horizontalThreshold);

  //     const verticalActive = verticalThreshold >= 0;
  //     const horizontalActive = horizontalThreshold >= 0;

  //     if (!verticalActive && !horizontalActive) return data;

  //     const annotations = [...data];
  //     annotations.sort(
  //       (a, b) => a.target.selector.geometry.bounds.minY - b.target.selector.geometry.bounds.minY,
  //     );
  //     console.log(
  //       'annotations to merge: ',
  //       annotations.map((a) => a.id.substring(0, 2)),
  //     );

  //     let changed = true;
  //     while (changed) {
  //       changed = false;
  //       for (let i = 0; i < annotations.length; i++) {
  //         for (let j = i + 1; j < annotations.length; j++) {
  //           const distance =
  //             origin === 'center'
  //               ? getDistanceBetweenAnnotationCenters(annotations[i], annotations[j])
  //               : getDistanceBetweenAnnotations(annotations[i], annotations[j]);
  //           console.log(
  //             'distance between ',
  //             annotations[i].id.substring(3),
  //             '<->',
  //             annotations[j].id.substring(3),
  //             ': ',
  //             distance,
  //           );
  //           const verticalOk = !verticalActive || Math.abs(distance.vertical) <= verticalThreshold;

  //           const horizontalOk =
  //             !horizontalActive || Math.abs(distance.horizontal) <= horizontalThreshold;

  //           if (verticalOk && horizontalOk) {
  //             //TODO! hack temporaire pour forcer le merge dans le bon ordre (pour que le texte soit dans le bon ordre)
  //             if (origin === 'center') {
  //               if (getLeft(annotations[i]) < getLeft(annotations[j])) {
  //                 //si merge de lignes, on merge de gauche à droite
  //                 annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
  //               } else {
  //                 annotations[i] = mergeTwoAnnotations(annotations[j], annotations[i]);
  //               }
  //             } else {
  //               annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
  //             }
  //             annotations.splice(j, 1);
  //             changed = true;
  //             break; // Break the inner loop to restart checking from the beginning
  //           }
  //         }
  //         if (changed) {
  //           break; // Break the outer loop to restart checking from the beginning
  //         }
  //       }
  //     }
  //     if (data.length !== annotations.length) {
  //       console.log(
  //         'annotations merged: ',
  //         annotations.map((a) => a.id.substring(0, 2)),
  //       );
  //     }
  //     return annotations;
  //   }
  //   return data;
  // };

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

    let changed = true;
    while (changed) {
      changed = false;

      for (let i = 0; i < annotations.length; i++) {
        for (let j = i + 1; j < annotations.length; j++) {
          const a = annotations[i];
          const b = annotations[j];

          const aB = getBounds(a);
          const bB = getBounds(b);

          //on ne paut pas utiliser ElementType.TEXT_LINE puisque les previews se font avec ElementType.TEMP
          //mais de toute façon, seuls les ElementType.TEXT_LINE ont un parent.
          // if (
          //   getAnnotationType(a) === getAnnotationType(b) &&
          //   getAnnotationType(a) === ElementType.TEXT_LINE
          // ) {
          const parentA = await annotationRepository.getParent(a);
          const parentB = await annotationRepository.getParent(b);

          if (parentA?.id.startsWith('f1f761b5') === true) {
            console.log('Comparing ', a.id.substring(0, 4), ' and ', b.id.substring(0, 4));
          }
          if (parentA !== null && parentB !== null && parentA.id !== parentB.id) {
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
