import { convertPresentation2 } from '@iiif/parser/presentation-2';
import { Manifest } from '@iiif/presentation-3';
import i18n from 'i18next';

export const convertJsonToManifest = (data: object): Manifest => {
  const manifest: Manifest = convertPresentation2(data) as Manifest;

  if (manifest === undefined) {
    throw new Error(i18n.t('error_parse_manifest'));
  }

  return manifest;
};
