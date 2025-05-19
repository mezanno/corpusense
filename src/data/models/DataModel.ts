export interface DataField {
  name: string;
  type: string;
  description?: string;
  color: string;
}

export interface DataModel {
  id: string;
  name: string;
  description?: string;
  fields: DataField[];
}

export interface DataModelCreateDTO {
  name: string;
  description?: string;
}
