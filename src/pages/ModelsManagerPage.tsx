import ModelViewer from '@/components/ModelViewer';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { removeModelRequest, setActiveModel } from '@/state/reducers/models';
import { getModels } from '@/state/selectors/models';
import { Trash2 } from 'lucide-react';

const ModelsManagerPage = () => {
  const models = useAppSelector(getModels);
  const appDispatch = useAppDispatch();

  const handleSelectModel = (modelId: string) => {
    appDispatch(setActiveModel(modelId));
  };

  const handleRemoveModel = (modelId: string) => {
    appDispatch(removeModelRequest(modelId));
  };

  return (
    <div>
      <div className='panel'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du modèle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} onClick={() => handleSelectModel(model.id)}>
                <TableCell>{model.name}</TableCell>
                <TableCell>{model.description}</TableCell>
                <TableCell className='space-x-2 align-middle'>
                  <Button
                    variant='destructive'
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveModel(model.id);
                    }}
                    // title={t('btn_delete')}
                    // aria-label={t('btn_delete')}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='panel mt-1'>
        <ModelViewer />
      </div>
    </div>
  );
};

export default ModelsManagerPage;
