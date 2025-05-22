export interface NamedEntitySelector {
  annotationId: string;
  indexes: number[]; // indexes of the words in the text of the annotation
}
export interface NamedEntity {
  id: string;
  dataFieldId: string;
  value: string;
  selector: NamedEntitySelector[];
  annotationsIds: string[]; //used by dexie for better performance
}
