import { Canvas } from '@iiif/presentation-3';
import { db } from './db';
import { CanvasRepository } from './types';

export class IndexedDBCanvasRepository implements CanvasRepository {
  async getCanvasById(id: string): Promise<Canvas> {
    const result = await db.storedItems.get(id);
    if (result === undefined) {
      throw new Error('error_canvas_not_found');
    }
    return result.content as Canvas;
  }

  async exists(id: string): Promise<boolean> {
    return !!(await db.storedItems.get(id));
  }

  async add(canvas: Canvas, manifestId: string): Promise<void> {
    await db.storedItems.add({
      id: canvas.id,
      content: canvas,
      parentId: manifestId,
    });
  }
}
