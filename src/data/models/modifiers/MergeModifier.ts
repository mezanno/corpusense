import { getDistanceBetweenAnnotations, mergeTwoAnnotations } from '@/data/utils/annotations';
import i18n from '@/i18n';
import { v4 as uuid } from 'uuid';
import z from 'zod';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

const mergeSchema = z.object({
  verticalThreshold: z.number().min(0),
  horizontalThreshold: z.number().min(0),
});

export class MergeModifier extends Modifier<typeof mergeSchema> {
  readonly verticalThresholdMax: number;
  readonly horizontalThresholdMax: number;

  constructor(verticalThresholdMax: number, horizontalThresholdMax: number) {
    super(
      uuid(),
      'MergeModifier',
      mergeSchema,
      {
        verticalThreshold: {
          label: i18n.t('form_label_modifier_merge_vertical'),
          description: i18n.t('form_description_modifier_merge_vertical'),
          min: 0,
          max: verticalThresholdMax,
          step: 1,
        },
        horizontalThreshold: {
          label: i18n.t('form_label_modifier_merge_horizontal'),
          description: i18n.t('form_description_modifier_merge_horizontal'),
          min: 0,
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
    if (data.length > 1) {
      const verticalThreshold = values.verticalThreshold;
      const horizontalThreshold = values.horizontalThreshold;

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
            const distance = getDistanceBetweenAnnotations(annotations[i], annotations[j]);
            if (
              Math.abs(distance.vertical) <= verticalThreshold &&
              Math.abs(distance.horizontal) <= horizontalThreshold
            ) {
              annotations[i] = mergeTwoAnnotations(annotations[i], annotations[j]);
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
