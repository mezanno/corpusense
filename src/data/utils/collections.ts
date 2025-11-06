function generateCollectionContent(
  position: number,
  canvasIds: string[],
  manifestId: string,
  existingCanvasIds: string[] = [],
) {
  return canvasIds
    .map((id) =>
      existingCanvasIds.includes(id)
        ? null
        : {
            canvasId: id,
            position: ++position,
            manifestId,
          },
    )
    .filter((elt) => elt !== null);
}

export { generateCollectionContent };
