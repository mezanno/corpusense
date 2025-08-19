import { Canvas } from '@iiif/presentation-3';
import { db } from './db';
import { CanvasRepository } from './types';

export class IndexedDBCanvasRepository implements CanvasRepository {
  async getCanvasById(id: string): Promise<Canvas> {
    const content = await db.storedItemContents.get(id);
    if (content === undefined) {
      throw new Error('error_canvas_not_found');
    }
    return content.content as Canvas;
  }

  async exists(id: string): Promise<boolean> {
    return !!(await db.storedItems.get(id));
  }
}
