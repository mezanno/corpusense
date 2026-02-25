import { Collection } from '@/data/models/Collection';
import { useCollections } from '@/hooks/data/collections/useCollections';
import { useModels } from '@/hooks/data/models/useModels';
import useModifierChainLive from '@/hooks/data/modifiers/useModifierChainLive';
import { useTags } from '@/hooks/data/tags/useTags';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag as FormTag, TagInput } from 'emblor';
import { debounce, uniq } from 'lodash';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
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
  postLayoutModifierChainId: z.string().optional(),
  postOcrModifierChainId: z.string().optional(),
});

const CollectionMetadataForm = ({ collection }: { collection: Collection }) => {
  const { models } = useModels();
  const { modifierChains } = useModifierChainLive();
  const { tags: storedTags, createNewTag } = useTags();

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
      postLayoutModifierChainId: collection.postLayoutModifierChainId,
      postOcrModifierChainId: collection.postOcrModifierChainId,
    },
  });

  const { setValue } = form;

  const { t } = useTranslation();

  const manifestIds = uniq(collection.content.map((el) => el.manifestId));

  const handleTagAdded = (newTags: FormTag[]) => {
    //on récupère les tags qui ne sont pas déjà dans la collection (state tags)
    const diff = newTags.filter((tag) => !tags.some((elt) => elt.id === tag.id));
    if (diff.length > 0) {
      void (async () => await createNewTag({ id: diff[0].id, label: diff[0].text }))();
    }
  };

  const onCollection = useEffectEvent((formTags: FormTag[]) => {
    setTags(formTags);
  });

  useEffect(() => {
    form.reset({
      name: collection.name,
      about: collection.about,
      tags: collectionTagsDefaultValue,
      modelId: collection.modelId,
      postLayoutModifierChainId: collection.postLayoutModifierChainId,
      postOcrModifierChainId: collection.postOcrModifierChainId,
    });

    onCollection(collectionTagsDefaultValue);
  }, [collection]);

  const watchedValues = useWatch({
    control: form.control,
  }) as z.infer<typeof formSchema>;
  const debouncedSave = useMemo(
    () =>
      debounce(async (values: z.infer<typeof formSchema>) => {
        const updatedCollection = { ...collection };

        updatedCollection.name = values.name;
        updatedCollection.about = values.about;
        updatedCollection.modelId = values.modelId;
        updatedCollection.postLayoutModifierChainId = values.postLayoutModifierChainId;
        updatedCollection.postOcrModifierChainId = values.postOcrModifierChainId;

        if (values.tags) {
          updatedCollection.tags = values.tags.map((tag) => tag.id);
        } else {
          updatedCollection.tags = [];
        }

        await updateCollection(updatedCollection);

        // reset dirty state proprement
        form.reset(values);
      }, 600), // 600ms après la dernière modification
    [collection, updateCollection, form],
  );

  useEffect(() => {
    if (!form.formState.isDirty || watchedValues.name === undefined) return;

    void debouncedSave(watchedValues);

    return () => {
      debouncedSave.cancel();
    };
  }, [watchedValues, form.formState.isDirty, debouncedSave]);

  return (
    <Form {...form}>
      <form className='mx-auto flex w-full flex-col gap-2 p-2 md:p-5'>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='postLayoutModifierChainId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_collection_postLayoutModifierChain')}</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className='h-10 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <option value=''>{t('form_placeholder_modifierchain')}</option>
                      {modifierChains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='postOcrModifierChainId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_collection_postOcrModifierChain')}</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className='h-10 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <option value=''>{t('form_placeholder_modifierchain')}</option>
                      {modifierChains.map((chain) => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className='mt-2 flex h-full flex-col'>
          <FormLabel>{t('form_label_collection_manifest')}</FormLabel>
          <ul className='mt-1 max-h-32 flex-1 overflow-auto rounded border bg-white p-2'>
            {manifestIds.map((id) => (
              <Link
                className='block break-all underline'
                key={id}
                to={`/manifest?manifestId=${id}`}
              >
                {id}
              </Link>
            ))}
          </ul>
        </div>
      </form>
    </Form>
  );
};

export default CollectionMetadataForm;
