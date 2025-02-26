/* eslint-disable @typescript-eslint/no-misused-promises */
import CanvasListViewer from '@/components/CanvasListViewer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { List } from '@/data/models/list';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { addListRequest, removeListRequest } from '@/state/reducers/lists';
import { getCanvasesOfList, getLists } from '@/state/selectors/lists';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(4, {
    message: 'Le nom de la liste doit contenir au moins 4 caractères',
  }),
});

const NewListForm = () => {
  const dispatch = useAppDispatch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    dispatch(addListRequest(values.name));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='w-full space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la liste</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Créer</Button>
      </form>
    </Form>
  );
};

const ListHoverCard = ({ list }: { list: List }) => {
  const canvases = useAppSelector(getCanvasesOfList(list.id as string));

  return (
    <div className='flex flex-col justify-between space-x-4'>
      <h4>{list.name}</h4>
      {list.content === undefined || list.content.length === 0 ? (
        <div>Cette liste ne contient aucun élément</div>
      ) : (
        <div>
          <div>Contient {list.content.length} éléments</div>
          <div>
            <CanvasListViewer
              width={500}
              height={150}
              size={4}
              layout='horizontal'
              canvases={canvases.map((canvas) => canvas.canvas)}
              handleCardClick={() => console.log('click')}
            />{' '}
          </div>
        </div>
      )}
    </div>
  );
};

const ListsManagerPage = () => {
  const lists: List[] = useAppSelector(getLists);
  const dispatch = useAppDispatch();

  const handleDelete = (id: string) => {
    dispatch(removeListRequest(id));
  };

  return (
    <main className='flex h-full w-full flex-col items-center space-y-4 rounded-2xl border-1 bg-white'>
      <Accordion type='single' collapsible className='w-1/4'>
        <AccordionItem value='new-list'>
          <AccordionTrigger>Créer une nouvelle liste</AccordionTrigger>
          <AccordionContent>
            <div className='rounded-2xl border-2 border-gray-200 p-2'>
              <NewListForm />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {lists.length > 0 ? (
        <section className='flex h-full w-2/3 flex-col items-center space-y-1'>
          <div className='text-xl'>Vous avez {lists.length} liste(s)</div>
          <Table>
            {/* <TableCaption>Vos Listes</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la liste</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Informations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lists.map((list) => (
                <HoverCard key={list.id}>
                  <HoverCardTrigger asChild>
                    <TableRow>
                      <TableCell>{list.name}</TableCell>
                      <TableCell className='space-x-2'>
                        <Button
                          variant='destructive'
                          onClick={() => handleDelete(list.id as string)}
                        >
                          <Trash2 />
                          Supprimer
                        </Button>
                      </TableCell>
                      <TableCell>
                        {list.content === undefined || list.content.length === 0 ? (
                          <Badge variant='secondary' className='text-sm'>
                            Liste vide
                          </Badge>
                        ) : (
                          <Badge className='text-sm'>
                            <span className='text-md font-bold'>{list.content.length}</span>{' '}
                            élément(s)
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  </HoverCardTrigger>
                  <HoverCardContent className='w-full'>
                    <ListHoverCard list={list} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <div className='text-2xl'>Vous n&apos;avez aucune liste actuellement</div>
      )}
    </main>
  );
};

export default ListsManagerPage;
