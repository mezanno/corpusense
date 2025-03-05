export interface ItemMetadataAttribute {
  label: string;
  value: string;
}

export interface ItemMetadata {
  id: string;
  attributes: ItemMetadataAttribute[];
}
