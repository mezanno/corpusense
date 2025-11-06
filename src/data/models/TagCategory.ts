import { Tag } from './Tag';

export interface TagCategory {
  id: string; //uuid
  label: string;
  description?: string;
  tags?: Tag[];
}
