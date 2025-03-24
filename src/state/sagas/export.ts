import { db } from '@/data/db';
import { List } from '@/data/models/List';
import { ItemMetadata } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, put, takeLatest } from 'redux-saga/effects';
import { exportRequest, exportSuccess } from '../reducers/export';

function* handleExportRequest(
  action: PayloadAction<string>,
): Generator<Effect, void, List | StoredItem | Tag[] | ItemMetadata[]> {
  const listId = action.payload;

  const result = yield call(() => db.lists.get(listId));
  const listToExport = result as List;
  console.log('List to export', listToExport);

  let exportLines = '';
  let header = 'nom_liste\turl\tnum_page\ttags';

  let firstTimeHeader = true;
  if (listToExport !== undefined && listToExport.content) {
    for (let i = 0; i < listToExport.content.length; i++) {
      let csvLine = listToExport.name;
      const canvas = listToExport.content[i];
      const storedCanvas = yield db.storedItems.get(canvas.canvasId);
      // console.log(storedCanvas);

      const url = storedCanvas.content.items[0].items[0].body.id;
      csvLine = csvLine.concat('\t').concat(url);

      const label = storedCanvas.content.label.none[0];
      csvLine = csvLine.concat('\t').concat(label);

      if (listToExport.tags) {
        const result = yield call(() =>
          db.tags.filter((tag) => listToExport.tags!.includes(tag.id)).toArray(),
        );
        const tags = result as Tag[];
        const tagLabels = tags.reduce((acc, tag) => acc.concat(tag.label).concat(','), '');
        csvLine = csvLine.concat('\t').concat(tagLabels);
      }

      const match = canvas.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
      const manifestArk = match ? match[1] : null;
      if (manifestArk !== null) {
        const result = yield call(() =>
          db.itemMetadata.filter((itemMD) => itemMD.id.includes(manifestArk)).toArray(),
        );
        const metadata = result as ItemMetadata[];
        for (let i = 0; i < metadata.length; i++) {
          console.log();

          csvLine = csvLine.concat('\t').concat(metadata[i].attribute.value);
          if (firstTimeHeader) {
            header = header.concat('\t').concat(metadata[i].attribute.label);
          }
        }
        firstTimeHeader = false;
      }

      // if(listToExport.)

      csvLine = csvLine.concat('\n');
      exportLines = exportLines.concat(csvLine);
    }

    //   for (let i = 0; i < listToExport.content.length; i++) {
    //     const element = listToExport.content[i];

    //     const newData: { element: string; tags: string[]; metadata?: ItemMetadataAttribute[] } = {
    //       element: element.canvasId,
    //       tags: tags.map((tag) => tag.label),
    //     };

    //     //retrieve manifest information

    //       //   result = yield call(() =>
    //       //     db.storedItems.filter((m) => m.id.includes(manifestArk)).first(),
    //       //   );
    //       //   const manifest = result as StoredItem;
    //       //   console.log(manifest);
    //       //   if (manifest) {

    //     }

    //     exportData.push(newData);
    //   }
    // }
    yield put(exportSuccess(header.concat('\n').concat(exportLines)));
  }
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
}
