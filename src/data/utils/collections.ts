function generateCollectionContent(
  position: number,
  canvasIds: string[],
  collectionId: string,
  manifestId: string,
  existingCanvasIds: string[] = [],
) {
  return canvasIds
    .map((id) =>
      existingCanvasIds.includes(id)
        ? null
        : {
            canvasId: id,
            collectionId,
            position: ++position,
            manifestId,
          },
    )
    .filter((elt) => elt !== null);
}

export { generateCollectionContent };
