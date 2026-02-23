import { getDimensions, getLeft, getTop } from '@/data/utils/annotations';
import i18n from '@/i18n';
import { v4 as uuid } from 'uuid';
import z from 'zod';
import { Annotation } from '../Annotation';
import { Modifier } from './Modifier';

const reorderSchema = z.object({
  order: z.enum(['TL2BR']).default('TL2BR'),
});

type Column = {
  left: number;
  boxes: Annotation[];
};

export class ReOrderModifier extends Modifier<typeof reorderSchema> {
  type = 'ReOrderModifier';

  constructor() {
    super(
      uuid(),
      'ReOrderModifier',
      reorderSchema,
      {
        order: {
          label: i18n.t('form_label_modifier_reorder_order'),
          description: i18n.t('form_description_modifier_reorder_order'),
          options: ['TL2BR'],
        },
      },
      i18n.t('form_description_modifier_reorder'),
    );
  }

  //Reading Order Resolution --> Column-based reading order //TODO: voir Docstrum algorithm
  //TODO: ajouter d'autres ordres possibles (ex: ZIGZAG, etc.)
  apply = (data: Annotation[], values: z.infer<typeof reorderSchema>) => {
    console.log('Applying ReOrderModifier with values: ', values, ' on data: ', data);

    if (data.length > 1) {
      const annotations = [...data];

      const columnThresholdRatio = 0.6; // ajustable
      //1. Largeur moyenne (sert à déterminer seuil de colonne)
      const avgWidth =
        annotations.reduce((sum, a) => sum + getDimensions(a).width, 0) / annotations.length;

      const columnThreshold = avgWidth * columnThresholdRatio;

      const columns: Column[] = [];

      //2. Regroupement en colonnes
      for (const box of annotations) {
        const left = getLeft(box);

        let columnFound = false;

        for (const column of columns) {
          if (Math.abs(left - column.left) < columnThreshold) {
            column.boxes.push(box);

            // Mise à jour douce du centre de colonne
            column.left =
              column.boxes.reduce((sum, b) => sum + getLeft(b), 0) / column.boxes.length;

            columnFound = true;
            break;
          }
        }

        if (!columnFound) {
          columns.push({
            left,
            boxes: [box],
          });
        }
      }

      //3. Trier colonnes gauche → droite
      columns.sort((a, b) => a.left - b.left);

      //4. Trier chaque colonne haut → bas
      for (const column of columns) {
        column.boxes.sort((a, b) => getTop(a) - getTop(b));
      }

      // 5️⃣ Aplatir
      const result = columns.flatMap((c) => c.boxes);

      let index = 0;
      result.forEach((a) => (a.order = index++));
      console.log(
        'annotations reordered: ',
        result.map((a) => a.id.substring(0, 2)),
      );

      return result;
    }

    return data;
  };
}
