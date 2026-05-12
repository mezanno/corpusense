import { getFile } from '@/data/utils/canvas';
import { supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import { IIIFExternalWebResource } from '@iiif/presentation-3';

const uploadCanvasImage = async (image: IIIFExternalWebResource): Promise<string> => {
  if (image.id === undefined) {
    throw new Error('Image ID is undefined');
  }

  if (image.id.startsWith('http') === false) {
    const imageToProcess = await getFile(image.id);
    return await uploadFile(imageToProcess);
  } else {
    const res = await fetch(image.id);
    if (!res.ok) throw new Error('Failed to fetch image');
    const blob = await res.blob();
    return await uploadFile(blob);
  }
};

const uploadFile = async (blob: Blob) => {
  const filePath = `uploads/${crypto.randomUUID()}`;
  const { data: uploadData, error } = await supabase.storage
    .from('corpusense')
    .upload(filePath, blob, {
      cacheControl: '3600',
      upsert: true,
    });
  if (error) {
    throw new Error(getErrorMessage(error));
  }
  const { data } = supabase.storage.from('corpusense').getPublicUrl(uploadData.path);
  return data.publicUrl;
};

export { uploadCanvasImage };
