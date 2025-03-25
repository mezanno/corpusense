import { db } from '@/data/db';
import { List } from '@/data/models/List';
import { ItemMetadata } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { Canvas, IIIFExternalWebResource } from '@iiif/presentation-3';
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
      const listElement = listToExport.content[i];
      const storedCanvas = (yield call(() => db.storedItems.get(listElement.canvasId))) as
        | StoredItem
        | undefined;

      const canvas = storedCanvas?.content as Canvas;
      if (canvas !== undefined) {
        const image = canvas.items?.[0]?.items?.[0].body as IIIFExternalWebResource;
        const url = image.id;

        if (url !== undefined) {
          csvLine = csvLine.concat('\t').concat(url);

          const label = canvas.label?.none?.[0] ?? '';
          csvLine = csvLine.concat('\t').concat(label);

          if (listToExport.tags) {
            const resultTags = yield call(() =>
              db.tags.filter((tag) => listToExport.tags!.includes(tag.id)).toArray(),
            );
            const tags = resultTags as Tag[];
            const tagLabels = tags.reduce((acc, tag) => acc.concat(tag.label).concat(','), '');
            csvLine = csvLine.concat('\t').concat(tagLabels);
          }

          const match = listElement.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
          const manifestArk = match ? match[1] : null;
          if (manifestArk !== null) {
            const resultMetadata = yield call(() =>
              db.itemMetadata.filter((itemMD) => itemMD.id.includes(manifestArk)).toArray(),
            );
            const metadata = resultMetadata as ItemMetadata[];
            for (let j = 0; j < metadata.length; j++) {
              console.log();

              csvLine = csvLine.concat('\t').concat(metadata[j].attribute.value);
              if (firstTimeHeader) {
                header = header.concat('\t').concat(metadata[j].attribute.label);
              }
            }
            firstTimeHeader = false;
          }
          csvLine = csvLine.concat('\n');
          exportLines = exportLines.concat(csvLine);
        }
      }
    }

    yield put(exportSuccess(header.concat('\n').concat(exportLines)));
  }
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
}
