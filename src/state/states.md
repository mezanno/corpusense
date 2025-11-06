# Reducers

## manifests

```javascript
interface ManifestState {
  isLoading: boolean;
  error: string | null;
  data: Manifest | null;
  history: History[];
}
const initialState: ManifestState = {
  isLoading: false,
  error: '',
  data: null,
  history: [],
};
```

| action               | payload                     | description                                     |
| -------------------- | --------------------------- | ----------------------------------------------- |
| fetchManifestRequest | string: URL of the manifest | Fetch the manifest data by URL                  |
| fetchManifestError   | string: error message       |
| fetchManifestSuccess | Manifest: data              | import { Manifest } from '@iiif/presentation-3' |
| historyUpdated       | History                     | called if the history has been updated          |
| setHistory           | History[]                   | called at init                                  |

## selection

```javascript
type SelectionState = SelectedCanvas[];

const initialState: SelectionState = [];
initialState: {
  canvases: initialState,
},
```

| action            | payload          | description                                                    |
| ----------------- | ---------------- | -------------------------------------------------------------- |
| setSelection      | SelectedCanvas[] | set the selection canvases                                     |
| setSelectionStart | SelectedCanvas   | set the selected element as the first element of the selection |
| setSelectionEnd   | SelectedCanvas   | set the selected element as the last element of the selection  |

## lists

```javascript
interface ListsState {
  values: List[];
  error: string;
}

const initialState: ListsState = {
  values: [],
  error: '',
};
```

| action                     | payload                                         | description              |
| -------------------------- | ----------------------------------------------- | ------------------------ |
| addListRequest             | string                                          | used to call Saga effect |
| addListSuccess             | List                                            |
| removeListRequest          | string                                          | used to call Saga effect |
| removeListSuccess          | string                                          |
| setLists                   | List[]                                          |
| addSelectionToListRequest  | { selection: SelectedCanvas[]; listId: string } | used to call Saga effect |
| addSelectionToListSuccess  | List                                            |
| fetchCanvasesOfListRequest | string                                          | used to call Saga effect |
| fetchCanvasesOfListSuccess | List                                            |

## canvas

```javascript
interface CanvasesState {
  values: { [key: string]: ContentResource };
}
const initialState: CanvasesState = {
  values: {},
};
```

| action                 | payload                                          | description |
| ---------------------- | ------------------------------------------------ | ----------- |
| setCanvasFromComponent | { componentId: string; canvas: ContentResource } |
