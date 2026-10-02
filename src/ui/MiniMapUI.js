export default class MiniMapUI {
  constructor(scene) {
    this.scene = scene;

    this.isDragging = false;
    this.dragPointerId = null;

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

    // Minimap input - click / drag camera
    this.panel.setInteractive({ useHandCursor: true });

    this.isDragging = false;
    this.dragPointerId = null;

    this.panel.on("pointerdown", (pointer) => {
      const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);

      this.scene.enterFreeCamera(worldPoint.x, worldPoint.y);

      this.isDragging = true;
      this.dragPointerId = pointer.id;
    });

    this.panel.on("pointermove", (pointer) => {
      if (!this.isDragging) return;
      if (pointer.id !== this.dragPointerId) return;

      const worldPoint = this.camera.getWorldPoint(pointer.x, pointer.y);

      this.scene.cameras.main.centerOn(worldPoint.x, worldPoint.y);
    });

    this.scene.input.on("pointerup", (pointer) => {
      if (pointer.id !== this.dragPointerId) return;

      this.isDragging = false;
      this.dragPointerId = null;
    });

    // Button for recenter camera back to the player
    this.recenterButton = scene.add
      .circle(0, 0, 14, 0x22282f, 0.95)
      .setStrokeStyle(1, 0x6b737c)
      .setScrollFactor(0)
      .setDepth(11002)
      .setInteractive({ useHandCursor: true });

    this.recenterButton.isUI = true;

    this.recenterText = scene.add
      .text(0, 0, "⌖", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11003);

    this.recenterText.isUI = true;

    this.recenterButton.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();

      this.recenterCameraOnPlayer();
    });

    // Create minimap camera
    this.camera = scene.cameras.add(0, 0, this.panelWidth, this.panelHeight);

    this.camera.setBackgroundColor(0x182018);

    // Only the Tiled map should be rendered by the minimap camera.
    const mapLayers = Object.values(scene.mapManager.layers);

    const objectsToIgnore = scene.children.list.filter((object) => !mapLayers.includes(object));

    this.camera.ignore(objectsToIgnore);

    // Create the player marker AFTER the minimap ignore list.
    // This makes the marker intentionally belong to the minimap.
    this.playerMarker = scene.add.circle(scene.player.x, scene.player.y, 4, 0xff0000, 1).setDepth(11002);

    // The main gameplay camera should not render the minimap marker.
    scene.cameras.main.ignore(this.playerMarker);

    // Base marker
    const baseNode = scene.navigationManager.getBaseNode();

    this.baseMarker = scene.add.circle(baseNode.x, baseNode.y, 5, 0xffd34d, 1).setDepth(11002);

    // Main gameplay camera should not render the base marker.
    scene.cameras.main.ignore(this.baseMarker);

    // Enemy camp markers
    this.campMarkers = [];

    const campNodes = scene.navigationManager.getCampNodes();

    for (const campNode of campNodes) {
      const marker = scene.add.circle(campNode.x, campNode.y, 4, 0xff5555, 1).setDepth(11002);

      scene.cameras.main.ignore(marker);

      this.campMarkers.push(marker);
    }

    this.setupCamera();
  }

  setupCamera() {
    const bounds = this.scene.mapManager.getWorldBounds();

    const scaleX = this.panelWidth / bounds.width;
    const scaleY = this.panelHeight / bounds.height;

    const zoom = Math.min(scaleX, scaleY);

    this.camera.setZoom(zoom);

    this.camera.centerOn(bounds.width / 2, bounds.height / 2);

    if (this.playerMarker) {
      this.playerMarker.setScale(1 / zoom);
    }

    if (this.baseMarker) {
      this.baseMarker.setScale(1 / zoom);
    }

    if (this.campMarkers) {
      for (const marker of this.campMarkers) {
        marker.setScale(1 / zoom);
      }
    }
  }

  recenterCameraOnPlayer() {
    this.scene.returnToPlayerCamera();
  }

  resetUIPosition() {
    const x = this.margin + this.panelWidth / 2;
    const y = this.margin + this.panelHeight / 2;

    this.panel.setPosition(x, y);
    this.border.setPosition(x, y);

    this.camera.setViewport(this.margin, this.margin, this.panelWidth, this.panelHeight);

    this.recenterButton.setPosition(this.margin + this.panelWidth - 16, this.margin + this.panelHeight + 18);
    this.recenterText.setPosition(this.recenterButton.x, this.recenterButton.y);

    this.setupCamera();
  }

  update() {
    if (!this.playerMarker) return;

    this.playerMarker.setPosition(this.scene.player.x, this.scene.player.y);
  }

  destroy() {
    this.playerMarker?.destroy();
    this.baseMarker?.destroy();

    if (this.campMarkers) {
      for (const marker of this.campMarkers) {
        marker.destroy();
      }
    }

    this.recenterButton?.destroy();
    this.recenterText?.destroy();

    this.panel?.destroy();
    this.border?.destroy();

    if (this.camera) {
      this.camera.destroy();
      this.camera = null;
    }
  }
}
