import i18next from 'i18next';
import { DataModel } from '../models/DataModel';

const generatePreview = (model: DataModel) => {
  console.log(`Model preview: `, model);

  let preview = '{';
  for (let i = 0; i < model.fields.length; i++) {
    const field = model.fields[i];
    preview = preview.concat(`"${field.name}":{`);
    preview = preview.concat(`"type":"${field.type}",`);
    preview = preview.concat(
      `"description":"${field.description}.${field?.generated === true ? i18next.t('ia_generated') : ''}"`,
    );
    preview = preview.concat(`}`);
    if (i !== model.fields.length - 1) {
      preview = preview.concat(',');
    }
  }
  preview += '}';
  return preview;
};

const generateSchema = (model: DataModel) => {
  const modelWithConfidfidence = {
    ...model,
    fields: [
      ...model.fields,
      {
        id: 'confiance',
        name: 'confiance',
        type: 'number',
        description:
          '(valeur comprise entre 0 et 1, 0 pour confiance minimale et 1 pour la confiance maximale). Si un élément ne te semble pas pertient, garde-le et donne-lui un indice de confiance de 0. ',
        generated: true,
        color: '#000000',
      },
    ],
  };
  const schema = {
    type: 'object',
    properties: {
      ...modelWithConfidfidence.fields.reduce(
        (acc, field) => {
          acc[field.name] = {
            type: field.type,
            description: (field.description ?? '').concat(
              field?.generated === true ? i18next.t('ia_generated') : '',
            ),
          };
          return acc;
        },
        {} as Record<string, { type: string; description: string }>,
      ),
    },
  };
  return JSON.stringify(schema, null, 2);
};

export { generatePreview, generateSchema };
