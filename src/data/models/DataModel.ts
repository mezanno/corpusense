export interface DataField {
  id: string;
  name: string;
  type: string;
  description?: string;
  generated?: boolean;
  isArray?: boolean;
  color: string;
}

export interface DataModel {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  fields: DataField[];
}

export interface DataModelCreateDTO {
  name: string;
  description?: string;
  fromModelId?: string;
}
