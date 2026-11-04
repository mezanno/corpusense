function generateCollectionContent(
  canvasIds: string[],
  sourceId: string,
  existingCanvasIds: string[] = [],
) {
  return canvasIds
    .map((id) =>
      existingCanvasIds.includes(id)
        ? null
        : {
            canvasId: id,
            sourceId,
          },
    )
    .filter((elt) => elt !== null);
}

export { generateCollectionContent };
