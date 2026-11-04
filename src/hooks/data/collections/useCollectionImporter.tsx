import {
  CollectionSchema,
  ExportedCollection,
  ExportedCollectionSchema,
  LegacyExportedCollection,
  LegacyExportedCollectionSchema,
} from '@/data/models/collection/collection';
import { SourceWithContent } from '@/data/models/source/source';
import {
  getAnnotationRepository,
  getCollectionRepository,
  getModelRepository,
  getResultRepository,
  getSourceRepository,
  getTagRepository,
  getWorkerRepository,
} from '@/data/repositories/indexeddb/dbFactory';
import { useAppDispatch } from '@/hooks/hooks';
import { ProgressLoggerSetters } from '@/hooks/ui/useLogger';
import { FunctionResult } from '@/utils/functionResult';
import { getErrorMessage } from '@/utils/utils';
import { Cozy } from 'cozy-iiif';
import { default as JSZip } from 'jszip';
import { uniq } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSources from '../sources/useSources';

export const useCollectionImporter = (setters: ProgressLoggerSetters) => {
  const { t } = useTranslation();
  const appDispatch = useAppDispatch();
  const { setStatus, setProgress, addLog } = setters;
  const { fetchManifest, addManifestToLibrary } = useSources();

  const collectionRepository = useMemo(() => getCollectionRepository(), []);

  const convertLegacyCollection = useCallback(
    async (legacyCollection: LegacyExportedCollection): Promise<ExportedCollection> => {
      const { collection, annotations, model, workers, results, tags } = legacyCollection;
      /*
      To convert a legacy collection to the new format, we need to map the legacy collection elements to the new collection elements.
      A legacy collection element has no sourceId, so we need to create a sourceId for each element based on the manifestId
      */
      //step 1 : fetch all the manifests for the legacy collection elements and create a new sourceId for each manifestId
      const manifestIds = uniq(collection.content.map((item) => item.manifestId)).filter(
        (id) => id !== undefined,
      );
      const manifestMap = new Map<string, string>();
      //load all the manifests in parallel
      const manifests = await Promise.all(
        manifestIds.map(async (id) => {
          const loadedManifestResult = await fetchManifest(id);

          if (!loadedManifestResult.ok) {
            throw loadedManifestResult.error;
          }
          return { id, loadedManifest: loadedManifestResult.value };
        }),
      );
      const sources: SourceWithContent[] = [];
      //then add the manifests to the library and create a new sourceId for each manifestId
      for (const { id, loadedManifest } of manifests) {
        addLog(t('log_fetched_manifest', { id }));

        const parsed = Cozy.parse(loadedManifest);
        if (parsed?.type !== 'manifest') {
          addLog(t('error_manifest_not_valid_iiif', { id }), 'error');
          throw new Error(`Manifest ${id} is not a valid IIIF manifest`);
        }

        const name =
          parsed.resource.getSummary() ??
          t('manifest_untitled', { date: new Date().toLocaleString() });

        const newSourceResult = await addManifestToLibrary(loadedManifest, name);
        FunctionResult.match(newSourceResult, {
          ok: (newSource) => {
            addLog(t('log_manifest_added_to_library', { id, sourceId: newSource.id }), 'success');
            manifestMap.set(id, newSource.id);
            sources.push(newSource);
          },
          err: (error) => {
            addLog(
              t('error_adding_manifest_to_library', { id, error: getErrorMessage(error) }),
              'error',
            );
            throw new Error(`Manifest ${id} could not be added to library`);
          },
        });
      }

      //step 2 : update the collection content with the new sourceIds
      const updatedCollection = {
        ...collection,
        content: collection.content.map((item) => ({
          ...item,
          sourceId:
            item.manifestId !== undefined
              ? (manifestMap.get(item.manifestId) ?? undefined)
              : undefined,
        })),
      };

      //step 3 : validate the updated collection with the new schema
      const parseResult = CollectionSchema.safeParse(updatedCollection);
      if (!parseResult.success) {
        addLog(t('error_manifest_conversion'), 'error');
        throw new Error(`Manifest conversion error`);
      } else {
        return {
          collection: parseResult.data,
          sources: [], //TODO: we could return the sources here, but we don't need them for now, so we can leave it empty
          annotations,
          model,
          workers,
          results,
          tags,
        };
      }
    },
    [],
  );

  const parseImportedCollection = useCallback(
    async (json: unknown): Promise<ExportedCollection> => {
      const parsed = ExportedCollectionSchema.safeParse(json);
      if (parsed.success) {
        return parsed.data;
      }

      const legacy = LegacyExportedCollectionSchema.safeParse(json);
      if (legacy.success) {
        addLog(t('log_legacy_collection_detected'), 'warning');
        return convertLegacyCollection(legacy.data);
      }

      throw parsed.error;
    },
    [],
  );

  const importCollection = useCallback(
    async (filename: string, json: object) => {
      addLog(t('log_importing_collection_from_file', { filename }));

      let importedCollection: ExportedCollection;

      try {
        importedCollection = await parseImportedCollection(json);
      } catch (error) {
        addLog(
          t('error_import_collection', {
            file: filename,
            error: error instanceof Error ? error.message : String(error),
          }),
          'error',
        );
        return;
      }
      const { collection, sources, annotations, model, workers, results, tags } =
        importedCollection;

      //réimporte les manifestes liés à la collection (si besoin)
      const manifestIds = uniq(collection.content.map((item) => item.manifestId)).filter(
        (id) => id !== undefined,
      );
      for (let i = 0; i < manifestIds.length; i++) {
        addLog(t('log_fetching_manifest', { id: manifestIds[i] }));
        await fetchManifest(manifestIds[i]);
      }

      try {
        const collectionWithTimeStamps = {
          ...collection,
          createdAt: collection.createdAt ?? new Date().toISOString(),
          updatedAt: collection.updatedAt ?? new Date().toISOString(),
        };
        await collectionRepository.add(collectionWithTimeStamps);
        addLog(t('log_collection_created', { id: collection.id }), 'success');
      } catch (e) {
        if (typeof e === 'object' && e !== null && 'name' in e && e.name === 'ConstraintError') {
          addLog(t('error_import_collection_already_exists', { id: collection.id }), 'error');
        } else {
          addLog(
            t('error_import_collection', { file: filename, error: getErrorMessage(e) }),
            'error',
          );
        }
        return;
      }

      if (sources !== undefined && sources.length > 0) {
        addLog(t('log_importing_sources', { count: sources.length, id: collection.id }));
        const sourceRepository = getSourceRepository();
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          addLog(t('log_importing_source', { sourceId: source.id, collectionId: collection.id }));
          const addSourceResult = await sourceRepository.addSourceWithContentAndThumbnail(source);
          FunctionResult.match(addSourceResult, {
            ok: () => {
              addLog(
                t('log_source_imported', { sourceId: source.id, collectionId: collection.id }),
                'success',
              );
            },
            err: (error) => {
              addLog(
                t('error_importing_source', {
                  sourceId: source.id,
                  collectionId: collection.id,
                  error: getErrorMessage(error),
                }),
                'error',
              );
            },
          });
        }
      }

      if (annotations !== undefined && annotations.length > 0) {
        addLog(t('log_importing_annotations', { count: annotations.length, id: collection.id }));
        const annotationRepository = getAnnotationRepository();
        const annotationsAdded = await annotationRepository.addAll(annotations);
        addLog(t('log_imported_annotations', { count: annotationsAdded.length }), 'success');
      }

      if (model !== undefined) {
        try {
          addLog(t('log_importing_model', { modelId: model.id, id: collection.id }));
          const modelRepository = getModelRepository();
          await modelRepository.add(model);
          addLog(t('log_model_imported', { modelId: model.id }), 'success');
        } catch (error) {
          addLog(
            t('error_importing_model', { modelId: model.id, error: getErrorMessage(error) }),
            'error',
          );
        }
      }

      if (workers !== undefined && workers.length > 0) {
        try {
          addLog(t('log_importing_workers', { count: workers.length, id: collection.id }));
          const workerRepository = getWorkerRepository();
          await workerRepository.addAll(workers);
          addLog(t('log_imported_workers', { count: workers.length }), 'success');
        } catch (error) {
          addLog(t('error_importing_workers', { error: getErrorMessage(error) }), 'error');
        }
      }

      if (results !== undefined && results.length > 0) {
        try {
          addLog(t('log_importing_results', { count: results.length, id: collection.id }));
          const resultRepository = getResultRepository();
          await resultRepository.addAll(results);
          addLog(t('log_imported_results', { count: results.length }), 'success');
        } catch (error) {
          addLog(t('error_importing_results', { error: getErrorMessage(error) }), 'error');
        }
      }

      if (tags !== undefined && tags.length > 0) {
        try {
          addLog(t('log_importing_tags', { count: tags.length, id: collection.id }));
          const tagRepository = getTagRepository();
          await tagRepository.addAll(tags);
          addLog(t('log_imported_tags', { count: tags.length }), 'success');
        } catch (error) {
          addLog(t('error_importing_tags', { error: getErrorMessage(error) }), 'error');
        }
      }

      addLog(t('log_collection_imported_success', { id: collection.id, filename }), 'success');
    },
    [appDispatch, collectionRepository, addLog],
  );

  const importCollections = useCallback(
    async (data: ArrayBuffer) => {
      setStatus('processing');
      addLog(t('log_starting_import_zip'));
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(data);
      const totalFiles = Object.keys(zipContent.files).length;
      for (let i = 0; i < totalFiles; i++) {
        const filename = Object.keys(zipContent.files)[i];
        const file = zipContent.files[filename];
        if (!file.dir) {
          const fileContent = await file.async('string');
          try {
            const json = JSON.parse(fileContent) as object;
            await importCollection(filename, json);
          } catch (e) {
            addLog(t('error_import_collection', { file: filename, error: getErrorMessage(e) }));
          }
        }
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      setStatus('done');
    },
    [addLog, importCollection, setProgress, setStatus],
  );

  const importOneCollection = useCallback(
    async (filename: string, json: object) => {
      setStatus('processing');
      try {
        await importCollection(filename, json);
      } catch (e) {
        addLog(
          t('error_import_collection', { file: filename, error: getErrorMessage(e) }),
          'error',
        );
      }
      setStatus('done');
    },
    [addLog, importCollection, setStatus],
  );

  return { importOneCollection, importCollections };
};
