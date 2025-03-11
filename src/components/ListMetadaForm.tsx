/* eslint-disable @typescript-eslint/no-misused-promises */
import { List } from '@/data/models/List';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { updateListRequest } from '@/state/reducers/lists';
import { addNewTag } from '@/state/reducers/tags';
import { getTags } from '@/state/selectors/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag as FormTag, TagInput } from 'emblor';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import './taginput.css'; //permet d'enlever le background transparent du taginput
import { Button } from './ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  name: z.string(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      }),
    )
    .optional(),
  about: z.string().optional(),
});

const ListMetadaForm = ({ list }: { list: List }) => {
  const dispatch = useAppDispatch();
  const storedTags = useAppSelector(getTags);
  //liste des tags existants dans l'application
  const autoCompleteTags = storedTags.map((tag) => ({
    id: tag.id,
    text: tag.label,
  }));

  //liste des tags de la liste
  const listTagsDefaultValue: FormTag[] = [];
  if (list.tags !== undefined) {
    list.tags.forEach((tagId) => {
      const tag = storedTags.find((t) => t.id === tagId);
      if (tag) {
        listTagsDefaultValue.push({ id: tag.id, text: tag.label });
      }
    });
  }
  const [tags, setTags] = useState<FormTag[]>(listTagsDefaultValue);

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: list.name,
      about: list.about,
      tags: listTagsDefaultValue,
    },
  });

  const { setValue } = form;

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values.tags);

    const updatedList = { ...list };
    updatedList.name = values.name;
    updatedList.about = values.about;
    if (values.tags !== undefined) {
      updatedList.tags = values.tags.map((tag) => tag.id);
    }
    dispatch(updateListRequest(updatedList));
  }

  const handleTagAdded = (newTags: FormTag[]) => {
    console.log('handleTagAdded: ', newTags);

    //on récupère les tags qui ne sont pas déjà dans la liste (state tags)
    const diff = newTags.filter((tag) => !tags.some((t) => t.id === tag.id));
    if (diff.length > 0) {
      console.log(diff[0]);
      dispatch(addNewTag({ id: diff[0].id, label: diff[0].text }));
    }
  };

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='mx-auto flex w-full flex-col gap-2 p-2 md:p-5'
        >
          <div className='flex gap-2'>
            <div className='flex w-1/2 flex-col gap-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='ma liste'
                        type={'text'}
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='about'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='A propos de cette liste'
                        className='resize-none'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem className='flex w-1/2 flex-col items-start'>
                  <FormLabel className='text-left'>Tags</FormLabel>
                  <FormControl id='test'>
                    <TagInput
                      {...field}
                      placeholder='Enter a tag'
                      tags={tags}
                      enableAutocomplete={true}
                      autocompleteOptions={autoCompleteTags}
                      setTags={(newTags) => {
                        setTags(newTags);
                        setValue('tags', newTags as [FormTag, ...FormTag[]]);
                        handleTagAdded(newTags as FormTag[]);
                      }}
                      generateTagId={() => uuid()}
                      styleClasses={{ inlineTagsContainer: 'tagInputInlineContainer' }}
                      activeTagIndex={activeTagIndex}
                      setActiveTagIndex={setActiveTagIndex}
                    />
                  </FormControl>
                  <FormDescription>Tags associated to this list</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex w-full items-center justify-end pt-3'>
            <Button className='rounded-lg' size='sm'>
              {/* {isPending ? 'Submitting...' : 'Submit'} */}
              Enregistrer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ListMetadaForm;
