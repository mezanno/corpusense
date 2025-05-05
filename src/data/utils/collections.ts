import { SelectedCanvas } from '../models/SelectedCanvas';

function generateCollectionContent(
  position: number,
  selection: SelectedCanvas[],
  collectionId: string,
  manifestId: string,
  existingCanvasIds: string[] = [],
) {
  return selection
    .map((elt) =>
      existingCanvasIds.includes(elt.canvas.id)
        ? null
        : {
            canvasId: elt.canvas.id,
            collectionId,
            position: ++position,
            manifestId,
          },
    )
    .filter((elt) => elt !== null);
}

export { generateCollectionContent };
