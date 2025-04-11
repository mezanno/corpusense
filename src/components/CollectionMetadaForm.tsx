/* eslint-disable @typescript-eslint/no-misused-promises */

import { Collection } from '@/data/models/Collection';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { updateCollectionRequest } from '@/state/reducers/collections';
import { addNewTag } from '@/state/reducers/tags';
import { getTags } from '@/state/selectors/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag as FormTag, TagInput } from 'emblor';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

const CollectionMetadaForm = ({ collection }: { collection: Collection }) => {
  const dispatch = useAppDispatch();
  const storedTags = useAppSelector(getTags);
  //liste des tags existants dans l'application
  const autoCompleteTags = storedTags.map((tag) => ({
    id: tag.id,
    text: tag.label,
  }));

  //liste des tags de la collection
  const collectionTagsDefaultValue: FormTag[] = [];
  if (collection.tags !== undefined) {
    collection.tags.forEach((tagId) => {
      const tag = storedTags.find((t) => t.id === tagId);
      if (tag) {
        collectionTagsDefaultValue.push({ id: tag.id, text: tag.label });
      }
    });
  }
  const [tags, setTags] = useState<FormTag[]>(collectionTagsDefaultValue);

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      about: collection.about,
      tags: collectionTagsDefaultValue,
    },
  });

  const { setValue } = form;

  const { t } = useTranslation();

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values.tags);

    const updatedCollection = { ...collection };
    updatedCollection.name = values.name;
    updatedCollection.about = values.about;
    if (values.tags !== undefined) {
      updatedCollection.tags = values.tags.map((tag) => tag.id);
    }
    dispatch(updateCollectionRequest(updatedCollection));
  }

  const handleTagAdded = (newTags: FormTag[]) => {
    console.log('handleTagAdded: ', newTags);

    //on récupère les tags qui ne sont pas déjà dans la collection (state tags)
    const diff = newTags.filter((tag) => !tags.some((elt) => elt.id === tag.id));
    if (diff.length > 0) {
      console.log(diff[0]);
      dispatch(addNewTag({ id: diff[0].id, label: diff[0].text }));
    }
  };

  useEffect(() => {
    setTags(collectionTagsDefaultValue);
    form.setValue('name', collection.name);
    form.setValue('about', collection.about);
  }, [collection]);

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
                    <FormLabel>{t('form_label_collection_name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form_placeholder_collection_name')}
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
                    <FormLabel>{t('form_label_about')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('form_placeholder_about')}
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
                  <FormLabel className='text-left'>{t('form_label_tags')}</FormLabel>
                  <FormControl id='test'>
                    {/* @ts-expect-error TagInput */}
                    <TagInput
                      {...field}
                      placeholder={t('form_placeholder_tags')}
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
                  <FormDescription>{t('form_description_tags')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex w-full items-center justify-end pt-3'>
            <Button className='rounded-lg' size='sm'>
              {/* {isPending ? 'Submitting...' : 'Submit'} */}
              {t('btn_save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CollectionMetadaForm;
