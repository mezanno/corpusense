import { db } from '@/data/db';
import { List } from '@/data/models/List';
import { ItemMetadata, ItemMetadataAttribute } from '@/data/models/Metadata';
import { StoredItem } from '@/data/models/StoredItem';
import { Tag } from '@/data/models/Tag';
import { PayloadAction } from '@reduxjs/toolkit';
import { call, Effect, takeLatest } from 'redux-saga/effects';
import { exportRequest } from '../reducers/export';

function* handleExportRequest(
  action: PayloadAction<string>,
): Generator<Effect, void, List | StoredItem | Tag[] | ItemMetadata[]> {
  const listId = action.payload;

  let result = yield call(() => db.lists.get(listId));
  const listToExport = result as List;

  const exportData = [];

  //TODO! ne fonctionne que s'il y a des tags
  if (listToExport !== undefined && listToExport.content) {
    if (listToExport.tags) {
      result = yield call(() =>
        db.tags.filter((tag) => listToExport.tags!.includes(tag.id)).toArray(),
      );
      const tags = result as Tag[];

      for (let i = 0; i < listToExport.content.length; i++) {
        const element = listToExport.content[i];

        const newData: { element: string; tags: string[]; metadata?: ItemMetadataAttribute[] } = {
          element: element.canvasId,
          tags: tags.map((tag) => tag.label),
        };

        //retrieve manifest information
        const match = element.canvasId.match(/ark:\/\d+\/([^\\/]+)/);
        const manifestArk = match ? match[1] : null;
        if (manifestArk !== null) {
          //   result = yield call(() =>
          //     db.storedItems.filter((m) => m.id.includes(manifestArk)).first(),
          //   );
          //   const manifest = result as StoredItem;
          //   console.log(manifest);
          //   if (manifest) {
          result = yield call(() =>
            db.itemMetadata.filter((itemMD) => itemMD.id.includes(manifestArk)).toArray(),
          );
          const metadata = result as ItemMetadata[];
          newData.metadata = metadata.map((md) => md.attribute);
        }

        exportData.push(newData);
      }
    }
    console.log('Export data', exportData);
  }
}

export default function* exportSaga() {
  yield takeLatest(exportRequest, handleExportRequest);
}
