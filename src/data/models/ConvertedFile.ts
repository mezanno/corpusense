export interface ConvertedFile {
  id: string;
  title: string;
  pageCount: number;
  thumbnailBlob: Blob;
  outputDirectoryHandle: FileSystemDirectoryHandle;
  timestamp: number;
  manifestName: string;
}
