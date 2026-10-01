export default class MiniMapUI {
  constructor(scene) {
    this.scene = scene;

    const isMobile = scene.sys.game.device.input.touch;

    this.panelWidth = isMobile ? 130 : 180;
    this.panelHeight = isMobile ? 130 : 180;

    this.margin = 12;

    this.create();
    this.resetUIPosition();
  }

  create() {
    const scene = this.scene;

    // Minimap panel
    this.panel = scene.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x11161b, 0.9).setScrollFactor(0).setDepth(11000);

    this.panel.isUI = true;

    // Border
    this.border = scene.add
      .rectangle(0, 0, this.panelWidth, this.panelHeight)
      .setStrokeStyle(2, 0x4a5159, 1)
      .setFillStyle(0x000000, 0)
      .setScrollFactor(0)
      .setDepth(11001);

    this.border.isUI = true;

    // Create minimap camera
    this.camera = scene.cameras.add(0, 0, this.panelWidth, this.panelHeight);

    this.camera.setBackgroundColor(0x182018);

    // Only the Tiled map should be rendered by the minimap camera.
    const mapLayers = Object.values(scene.mapManager.layers);

    const objectsToIgnore = scene.children.list.filter((object) => !mapLayers.includes(object));

    this.camera.ignore(objectsToIgnore);

    this.setupCamera();
  }

  setupCamera() {
    const bounds = this.scene.mapManager.getWorldBounds();

    const scaleX = this.panelWidth / bounds.width;
    const scaleY = this.panelHeight / bounds.height;

    // Use the smaller scale so the entire world fits.
    const zoom = Math.min(scaleX, scaleY);

    this.camera.setZoom(zoom);

    // Center the camera on the world.
    this.camera.centerOn(bounds.width / 2, bounds.height / 2);
  }

  resetUIPosition() {
    const x = this.margin + this.panelWidth / 2;
    const y = this.margin + this.panelHeight / 2;

    this.panel.setPosition(x, y);
    this.border.setPosition(x, y);

    this.camera.setViewport(this.margin, this.margin, this.panelWidth, this.panelHeight);

    this.setupCamera();
  }

  update() {
    // Nothing dynamic yet.
  }

  destroy() {
    this.panel?.destroy();
    this.border?.destroy();

    if (this.camera) {
      this.camera.destroy();
      this.camera = null;
    }
  }
}
