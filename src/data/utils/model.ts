import { DataModel } from '../models/DataModel';

const generatePreview = (model: DataModel) => {
  console.log(`Model preview: `, model);

  let preview = '{';
  for (let i = 0; i < model.fields.length; i++) {
    const field = model.fields[i];
    preview = preview.concat(`"${field.name}":{`);
    preview = preview.concat(`"type":"${field.type}",`);
    preview = preview.concat(`"description":"${field.description}"`);
    preview = preview.concat(`}`);
    if (i !== model.fields.length - 1) {
      preview = preview.concat(',');
    }
  }
  preview += '}';
  return preview;
};

export { generatePreview };
