import { getDistanceBetweenAnnotations, mergeTwoAnnotations } from '@/data/utils/annotations';
import { v4 as uuid } from 'uuid';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

type MergeModifierValues = {
  verticalThreshold: number;
  horizontalThreshold: number;
};

export class MergeModifier extends Modifier<MergeModifierValues> {
  readonly verticalThresholdMax: number;
  readonly horizontalThresholdMax: number;

  constructor(verticalThresholdMax: number, horizontalThresholdMax: number) {
    super(uuid(), 'MergeModifier');
    this.verticalThresholdMax = verticalThresholdMax;
    this.horizontalThresholdMax = horizontalThresholdMax;
  }

  apply = (data: Annotation[], values: MergeModifierValues) => {
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
