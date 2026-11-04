# Redux store

The store (`store.ts`) is deliberately minimal. It carries only process status and UI
notifications — **all business data lives in IndexedDB and reaches the UI through Dexie
`useLiveQuery` hooks** (`src/hooks/data/`). The former `manifests`, `selection`, `lists` and
`canvas` slices were removed during the local-first migration; anything still documented here
must match `src/state/index.ts`.

## workers (`reducers/workers.ts`)

Plugin metadata + saga trigger actions. The request-type reducers are intentional no-ops:
they exist so the saga (`sagas/workers.ts`) can take them.

| action                    | payload                     | description                                              |
| ------------------------- | --------------------------- | -------------------------------------------------------- |
| startWorkerProcessRequest | `StartWorkerProcessPayload` | saga takes it: starts a Worker run for a Scope           |
| stopWorkerProcessRequest  | `Worker`                    | saga takes it: races the running worker to cancellation  |
| recoverWorkerRequest      | `Worker`                    | saga takes it: recovers an interrupted worker            |
| setPlugins                | plugin info array           | populates `workerPluginsInfo` (registry metadata for UI) |

## events (`reducers/events.ts`)

System events / toasts.

| action         | payload | description                                  |
| -------------- | ------- | -------------------------------------------- |
| pushInfo       | string  | append an INFO event, set it as `lastEvent`  |
| pushError      | string  | append an ERROR event, set it as `lastEvent` |
| resetLastEvent | —       | clear `lastEvent` so it is not re-displayed  |

## Not in Redux

- Worker/Task data and statuses: IndexedDB + `useLiveQuery` + `useJobRealtime` (the status law
  itself is specified in `docs/statuts.md`; its consolidation into one pure module is
  `docs/roadmap.md` R1).
- Manifests, collections, annotations, tags, models, history: `useLiveQuery` hooks in
  `src/hooks/data/`.
- File-system handles: zustand (`zustand/useFSHandleStore.ts`).
