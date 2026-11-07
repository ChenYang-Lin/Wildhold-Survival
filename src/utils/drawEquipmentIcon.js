export function drawEquipmentIcon(scene, canvas, item) {
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (!item?.icon) return;

  const frame = scene.textures.getFrame("equipment", item.icon);

  if (!frame) {
    console.warn(`Equipment icon not found: ${item.icon}`);
    return;
  }

  const image = frame.source.image;

  context.imageSmoothingEnabled = false;

  context.drawImage(image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, canvas.width, canvas.height);
}
