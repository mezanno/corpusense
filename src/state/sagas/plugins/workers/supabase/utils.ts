import { getSourceRepository } from '@/data/repositories/indexeddb/dbFactory';
import { getFile, getImage } from '@/data/utils/canvas';
import { CanvasWithSourceId } from '@/hooks/data/collections/useCollectionContent';
import { supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import { MissingImageIdError, RemoteImageFetchError, SupabaseStorageError } from '../../errors';

export type UploadFileResult = {
  path: string;
  publicUrl: string;
};

const uploadCanvasImage = async (canvasWithSourceId: CanvasWithSourceId): Promise<string> => {
  const image = getImage(canvasWithSourceId.canvas);
  if (image.id === undefined) {
    throw new MissingImageIdError({
      canvasId: canvasWithSourceId.canvas.id,
      sourceId: canvasWithSourceId.sourceId,
    });
  }
  const sourceRepository = getSourceRepository();
  const sourceContentResult = await sourceRepository.getContentById(canvasWithSourceId.sourceId);
  if (!sourceContentResult.ok) {
    throw sourceContentResult.error;
  }

  const sourceContent = sourceContentResult.value;
  if (sourceContent.type === 'local') {
    const fileHandle = sourceContent.localFile.outputDirectoryHandle;
    const imageToProcess = await getFile(image.id, fileHandle);
    const { publicUrl } = await uploadFile(imageToProcess);
    return publicUrl;
  } else {
    const res = await fetch(image.id);
    if (!res.ok) throw new RemoteImageFetchError({ url: image.id, status: res.status });
    const blob = await res.blob();
    const { publicUrl } = await uploadFile(blob);
    return publicUrl;
  }
};

const uploadFile = async (blob: Blob): Promise<UploadFileResult> => {
  const filePath = `uploads/${crypto.randomUUID()}`;
  const { data: uploadData, error } = await supabase.storage
    .from('corpusense')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new SupabaseStorageError({
      action: 'upload',
      filePath,
      cause: getErrorMessage(error),
    });
  }
  const { data } = supabase.storage.from('corpusense').getPublicUrl(uploadData.path);
  return { path: uploadData.path, publicUrl: data.publicUrl };
};

const deleteFile = async (filePath: string) => {
  const { error } = await supabase.storage.from('corpusense').remove([filePath]);
  if (error) {
    throw new SupabaseStorageError({
      action: 'delete',
      filePath,
      cause: getErrorMessage(error),
    });
  }
};

export { deleteFile, uploadCanvasImage, uploadFile };
