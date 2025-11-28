/* eslint-disable @typescript-eslint/no-misused-promises */

import { Collection } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { createTagRequest } from '@/state/reducers/tags';
import { selectModels } from '@/state/selectors/models';
import { selectTags } from '@/state/selectors/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag as FormTag, TagInput } from 'emblor';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import './taginput.css'; //permet d'enlever le background transparent du taginput

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
  modelId: z.string().optional(),
});

const CollectionMetadataForm = ({ collection }: { collection: Collection }) => {
  const dispatch = useAppDispatch();
  const models = useAppSelector(selectModels);
  const storedTags = useAppSelector(selectTags);
  const { updateCollection } = useCollections();
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
      modelId: collection.modelId,
    },
  });

  const { setValue } = form;

  const { t } = useTranslation();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values.tags);

    const updatedCollection = { ...collection };
    updatedCollection.name = values.name;
    updatedCollection.about = values.about;
    updatedCollection.modelId = values.modelId;
    if (values.tags !== undefined) {
      updatedCollection.tags = values.tags.map((tag) => tag.id);
    }
    await updateCollection(updatedCollection);
  }

  const handleTagAdded = (newTags: FormTag[]) => {
    console.log('handleTagAdded: ', newTags);

    //on récupère les tags qui ne sont pas déjà dans la collection (state tags)
    const diff = newTags.filter((tag) => !tags.some((elt) => elt.id === tag.id));
    if (diff.length > 0) {
      console.log(diff[0]);
      dispatch(createTagRequest({ id: diff[0].id, label: diff[0].text }));
    }
  };

  useEffect(() => {
    setTags(collectionTagsDefaultValue);
    form.setValue('name', collection.name);
    form.setValue('about', collection.about);
    form.setValue('modelId', collection.modelId);
  }, [collection]);

  return (
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

            <FormField
              control={form.control}
              name='modelId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_model')}</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className='h-10 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <option value=''>{t('form_placeholder_model')}</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex w-1/2 flex-col gap-2'>
            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem className='flex flex-col items-start'>
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
                      title={t('aria_label_tags')}
                      alt={t('aria_label_tags')}
                    />
                  </FormControl>
                  <FormDescription>{t('form_description_tags')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className='flex w-full items-center justify-start pt-3'>
          <button className='soft-button'>{t('btn_save')}</button>
        </div>
      </form>
    </Form>
  );
};

export default CollectionMetadataForm;
