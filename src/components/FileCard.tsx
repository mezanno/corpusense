import { ConvertedFile } from '@/data/models/ConvertedFile';
import useConvertedFileIO from '@/hooks/data/convertedFiles/useConvertedFileIO';
import { Clock, Layers, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface FileCardProps {
  file: ConvertedFile;
}

export function FileCard({ file }: FileCardProps) {
  const { removeConvertedFile } = useConvertedFileIO();
  const thumbUrl = useMemo(() => URL.createObjectURL(file.thumbnailBlob), [file.thumbnailBlob]);

  const handleRemoveConvertedFile: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    void removeConvertedFile(file.id);
  };

  return (
    <Card
      className='card-file flex flex-col overflow-hidden bg-white'
      //   onClick={() => navigate(`/file/${file.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <CardHeader className='overflow-hidden'>
        <img src={thumbUrl} alt={file.title} className='rounded-t-xl object-cover' />
      </CardHeader>
      <CardContent className='flex flex-col justify-center'>
        <h3 className='font-bold' title={file.title}>
          {file.title}
        </h3>
        <div className='flex items-center space-x-2 text-sm'>
          <Layers size={14} /> <span>{file.pageCount} Pages</span>
        </div>
        <div className='flex items-center space-x-2 text-sm'>
          <Clock size={14} /> <span>{new Date(file.timestamp).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className='justify-end' onClick={handleRemoveConvertedFile}>
        <Trash2 size={14} />
      </CardFooter>
    </Card>
  );
}
