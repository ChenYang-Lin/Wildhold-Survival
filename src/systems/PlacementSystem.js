import { BUILDINGS } from "../data/buildings.js";

export default class PlacementSystem {
  constructor(scene) {
    this.scene = scene;

    this.mode = "normal";

    this.itemId = null;
    this.recipe = null;

    this.preview = null;
    this.buildButton = null;
    this.cancelButton = null;

    this.gridX = 0;
    this.gridY = 0;
    this.isValid = false;
  }

  get isPlacing() {
    return this.mode === "placing";
  }

  start(itemId) {
    const recipe = BUILDINGS[itemId];

    if (!recipe) return;

    if (!this.scene.actionSystem.canAfford(recipe)) {
      console.log("Not enough resources");
      return;
    }

    // Don't allow a second placement session.
    if (this.isPlacing) {
      this.cancel();
    }

    this.mode = "placing";
    this.itemId = itemId;
    this.recipe = recipe;

    const position = this.getInitialPosition();

    this.createPreview(position.gridX, position.gridY);
    this.createControls();

    this.updatePlacement(position.gridX, position.gridY);
  }

  moveToWorldPosition(x, y) {
    if (!this.isPlacing) return;

    const position = this.getGridPositionFromCenter(x, y);

    this.updatePlacement(position.gridX, position.gridY);
  }

  getInitialPosition() {
    const player = this.scene.player;

    const x = player.x + 32;
    const y = player.y;

    return {
      gridX: Math.floor(x / 32),
      gridY: Math.floor(y / 32),
    };
  }

  getGridPositionFromCenter(x, y) {
    const building = this.recipe;

    const centerOffsetX = building.footprintWidth / 2 + (building.spriteWidth - building.footprintWidth) / 2;

    const centerOffsetY = building.footprintHeight / 2 + (building.spriteHeight - building.footprintHeight) / 2;

    return {
      gridX: Math.round((x - centerOffsetX) / 32),

      gridY: Math.round((y - centerOffsetY) / 32),
    };
  }

  createPreview(gridX, gridY) {
    const position = this.scene.buildingManager.getBuildingWorldPosition(this.recipe, gridX, gridY);

    this.preview = this.scene.add.image(position.x, position.y, this.recipe.texture).setDepth(9000).setAlpha(0.55).setInteractive({
      draggable: true,
      useHandCursor: true,
    });

    this.scene.input.setDraggable(this.preview);

    this.preview.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();

      if (!this.isPlacing) return;

      const gridX = Math.floor(pointer.worldX / 32);
      const gridY = Math.floor(pointer.worldY / 32);

      this.updatePlacement(gridX, gridY);
    });

    this.preview.on("drag", (pointer) => {
      if (!this.isPlacing) return;

      this.moveToWorldPosition(pointer.worldX, pointer.worldY);
    });

    this.preview.on("dragstart", () => {
      if (!this.isPlacing) return;

      this.preview.setAlpha(0.7);
    });

    this.preview.on("dragend", () => {
      if (!this.isPlacing) return;

      this.preview.setAlpha(0.55);
    });
  }

  createControls() {
    const width = 54;
    const height = 24;

    this.buildButton = this.scene.add.rectangle(0, 0, width, height, 0x3b7d3b).setStrokeStyle(1, 0x8fd18f).setScrollFactor(1).setDepth(9001).setInteractive({
      useHandCursor: true,
    });

    this.buildButton.isUI = true;

    this.buildButtonText = this.scene.add
      .text(0, 0, "BUILD", {
        fontFamily: "Arial",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(9002);

    this.buildButtonText.isUI = true;

    this.cancelButton = this.scene.add.rectangle(0, 0, width, height, 0x7d3939).setStrokeStyle(1, 0xd18f8f).setDepth(9001).setInteractive({
      useHandCursor: true,
    });

    this.cancelButton.isUI = true;

    this.cancelButtonText = this.scene.add
      .text(0, 0, "CANCEL", {
        fontFamily: "Arial",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(9002);

    this.cancelButtonText.isUI = true;

    this.buildButton.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();

      if (!this.isPlacing) return;
      if (!this.isValid) return;

      this.confirm();
    });

    this.cancelButton.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();

      if (!this.isPlacing) return;

      this.cancel();
    });
  }

  updatePlacement(gridX, gridY) {
    if (!this.preview) return;

    const position = this.scene.buildingManager.getBuildingWorldPosition(this.recipe, gridX, gridY);

    this.preview.setPosition(position.x, position.y);

    this.gridX = gridX;
    this.gridY = gridY;

    this.isValid = this.scene.buildingManager.canPlace(this.recipe.id, this.gridX, this.gridY);

    this.updatePreviewVisual();
    this.updateControls();
  }

  updatePreviewVisual() {
    if (!this.preview) return;

    this.preview.setAlpha(this.isValid ? 0.55 : 0.3);

    this.preview.setTint(this.isValid ? 0x8aff8a : 0xff7777);
  }

  updateControls() {
    if (!this.preview) return;

    const x = this.preview.x;
    const y = this.preview.y;

    this.buildButton.setPosition(x - 30, y - 38);
    this.buildButtonText.setPosition(x - 30, y - 38);

    this.cancelButton.setPosition(x + 30, y - 38);
    this.cancelButtonText.setPosition(x + 30, y - 38);

    this.buildButton.setFillStyle(this.isValid ? 0x3b7d3b : 0x3b3f3b);

    this.buildButton.setAlpha(this.isValid ? 1 : 0.45);

    this.buildButtonText.setAlpha(this.isValid ? 1 : 0.45);
  }

  confirm() {
    if (!this.isPlacing) return;
    if (!this.isValid) return;

    const placed = this.scene.buildingManager.placeBuilding(this.recipe.id, this.gridX, this.gridY);

    if (!placed) {
      this.updatePlacement(this.gridX, this.gridY);
      return;
    }

    this.scene.actionSystem.payCost(this.recipe);

    this.finish();
  }

  cancel() {
    if (!this.isPlacing) return;

    this.finish();
  }

  finish() {
    this.preview?.destroy();

    this.buildButton?.destroy();
    this.buildButtonText?.destroy();

    this.cancelButton?.destroy();
    this.cancelButtonText?.destroy();

    this.preview = null;

    this.buildButton = null;
    this.buildButtonText = null;

    this.cancelButton = null;
    this.cancelButtonText = null;

    this.itemId = null;
    this.recipe = null;

    this.isValid = false;

    this.mode = "normal";
  }

  update() {
    if (!this.isPlacing) return;

    this.updateControls();
  }
}
