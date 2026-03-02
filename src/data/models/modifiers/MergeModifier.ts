import {
  getDistanceBetweenAnnotationCenters,
  getDistanceBetweenAnnotations,
  getLeft,
  mergeTwoAnnotations,
} from '@/data/utils/annotations';
import i18n from '@/i18n';
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

  apply = (data: Annotation[], values: z.infer<typeof mergeSchema>) => {
    console.log('Applying MergeModifier with values: ', values);
    if (data.length > 1) {
      const {
        origin,
        verticalThreshold: defaultVerticalThreshold,
        horizontalThreshold: defaultHorizontalThreshold,
      } = mergeSchema.parse(values);
      const verticalThreshold = values.verticalThreshold ?? defaultVerticalThreshold;
      const horizontalThreshold = values.horizontalThreshold ?? defaultHorizontalThreshold;
      console.log('Using ', verticalThreshold, '|', horizontalThreshold);

      const annotations = [...data];
      annotations.sort(
        (a, b) => a.target.selector.geometry.bounds.minY - b.target.selector.geometry.bounds.minY,
      );
      console.log(
        'annotations to merge: ',
        annotations.map((a) => a.id.substring(0, 2)),
      );

      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i < annotations.length; i++) {
          for (let j = i + 1; j < annotations.length; j++) {
            const distance =
              origin === 'center'
                ? getDistanceBetweenAnnotationCenters(annotations[i], annotations[j])
                : getDistanceBetweenAnnotations(annotations[i], annotations[j]);

            if (
              (verticalThreshold >= 0 && Math.abs(distance.vertical) <= verticalThreshold) ||
              (horizontalThreshold >= 0 && Math.abs(distance.horizontal) <= horizontalThreshold)
            ) {
              //TODO! hack temporaire pour forcer le merge dans le bon ordre (pour que le texte soit dans le bon ordre)
              if (origin === 'center') {
                if (getLeft(annotations[i]) < getLeft(annotations[j])) {
                  //si merge de lignes, on merge de gauche à droite
                  annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
                } else {
                  annotations[i] = mergeTwoAnnotations(annotations[j], annotations[i]);
                }
              } else {
                annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
              }
              annotations.splice(j, 1);
              changed = true;
              break; // Break the inner loop to restart checking from the beginning
            }
          }
          if (changed) {
            break; // Break the outer loop to restart checking from the beginning
          }
        }
      }
      if (data.length !== annotations.length) {
        console.log(
          'annotations merged: ',
          annotations.map((a) => a.id.substring(0, 2)),
        );
      }
      return annotations;
    }
    return data;
  };
}
