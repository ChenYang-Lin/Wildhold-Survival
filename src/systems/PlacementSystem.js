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

    this.movingBuilding = null;

    this.gridX = 0;
    this.gridY = 0;
    this.isValid = false;
  }

  get isPlacing() {
    return this.mode === "placing";
  }

  get isMoving() {
    return this.mode === "moving";
  }

  start(itemId, initialPosition = null) {
    const recipe = BUILDINGS[itemId];

    if (!recipe) return false;

    if (!this.scene.actionSystem.canAfford(recipe)) {
      console.log("Not enough resources");
      return false;
    }

    // Don't allow a second placement session.
    if (this.isPlacing) {
      this.cancel();
    }

    this.mode = "placing";
    this.itemId = itemId;
    this.recipe = recipe;

    const position = initialPosition ?? this.getInitialPosition();

    this.createPreview(position.gridX, position.gridY);
    this.createControls();

    this.updatePlacement(position.gridX, position.gridY);

    return true;
  }

  startMoving(building) {
    if (!building?.active || !building.body) return false;

    // Don't start another moving session while one is already active.
    if (this.mode !== "normal") return false;

    const recipe = BUILDINGS[building.texture.key];

    if (!recipe) return false;

    this.mode = "moving";
    this.movingBuilding = building;

    // Hide the original building while its preview is active.
    building.setVisible(false);
    building.weapon?.setVisible(false);

    this.itemId = building.texture.key;
    this.recipe = recipe;

    const { gridX, gridY } = this.getGridPositionFromCenter(building.x, building.y);

    this.createPreview(gridX, gridY);
    this.createControls();

    // Moving must ignore the building's own occupied tiles.
    this.updatePlacement(gridX, gridY);

    return true;
  }

  moveToWorldPosition(x, y) {
    if (!this.isPlacing && !this.isMoving) return;

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

      if (!this.isPlacing && !this.isMoving) return;

      const gridX = Math.floor(pointer.worldX / 32);
      const gridY = Math.floor(pointer.worldY / 32);

      this.updatePlacement(gridX, gridY);
    });

    this.preview.on("drag", (pointer) => {
      if (!this.isPlacing && !this.isMoving) return;

      this.moveToWorldPosition(pointer.worldX, pointer.worldY);
    });

    this.preview.on("dragstart", () => {
      if (!this.isPlacing && !this.isMoving) return;

      this.preview.setAlpha(0.7);
    });

    this.preview.on("dragend", () => {
      if (!this.isPlacing && !this.isMoving) return;

      this.preview.setAlpha(0.55);

      this.notifyTutorialOfValidPosition();
    });
  }

  notifyTutorialOfValidPosition() {
    if (!this.isPlacing || !this.isValid) return;

    this.scene.tutorialSystem?.handleAction("placement.drag");
  }

  createControls() {
    const width = 54;
    const height = 24;

    this.buildButton = this.scene.add.rectangle(0, 0, width, height, 0x3b7d3b).setStrokeStyle(1, 0x8fd18f).setScrollFactor(1).setDepth(9001).setInteractive({
      useHandCursor: true,
    });

    this.buildButton.isUI = true;

    this.buildButtonText = this.scene.add
      .text(0, 0, this.isMoving ? "MOVE" : "BUILD", {
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

      if (!this.isPlacing && !this.isMoving) return;
      if (!this.isValid) return;

      if (this.isPlacing) {
        if (!this.scene.tutorialSystem?.isActionAllowed("placement.build")) {
          return;
        }
      }

      this.confirm();
    });

    this.cancelButton.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();

      if (!this.isPlacing && !this.isMoving) return;

      if (this.isPlacing) {
        if (!this.scene.tutorialSystem?.isActionAllowed("placement.cancel")) {
          return;
        }
      }

      this.cancel();
    });
  }

  findNearestValidPosition(itemId, originGridX, originGridY) {
    const bounds = this.scene.mapManager.getWorldBounds();
    const mapWidth = bounds.width / this.scene.buildingManager.tileSize;
    const mapHeight = bounds.height / this.scene.buildingManager.tileSize;

    const maxRadius = Math.max(mapWidth, mapHeight);

    for (let radius = 0; radius <= maxRadius; radius++) {
      const candidates = [];

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check the perimeter of this radius.
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
            continue;
          }

          const gridX = originGridX + dx;
          const gridY = originGridY + dy;

          candidates.push({
            gridX,
            gridY,
            distance: dx * dx + dy * dy,
          });
        }
      }

      // Check closer positions first within this radius.
      candidates.sort((a, b) => a.distance - b.distance);

      for (const position of candidates) {
        if (this.scene.buildingManager.canPlace(itemId, position.gridX, position.gridY)) {
          return {
            gridX: position.gridX,
            gridY: position.gridY,
          };
        }
      }
    }

    return null;
  }

  updatePlacement(gridX, gridY) {
    if (!this.preview) return;

    const position = this.scene.buildingManager.getBuildingWorldPosition(this.recipe, gridX, gridY);

    this.preview.setPosition(position.x, position.y);

    this.gridX = gridX;
    this.gridY = gridY;

    const ignoreBuilding = this.isMoving ? this.movingBuilding : null;

    this.isValid = this.scene.buildingManager.canPlace(this.recipe.id, this.gridX, this.gridY, ignoreBuilding);

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
    if (!this.isPlacing && !this.isMoving) return;
    if (!this.isValid) return;

    // Moving an existing building.
    if (this.isMoving) {
      const building = this.movingBuilding;

      const moved = this.scene.buildingManager.moveBuilding(building, this.gridX, this.gridY);

      if (!moved) {
        this.updatePlacement(this.gridX, this.gridY);
        return;
      }

      building.setVisible(true);
      building.weapon?.setVisible(true);

      this.finish();
      this.scene.buildingInteractionSystem?.close();

      return;
    }

    // Placing a new building.
    const tutorial = this.scene.tutorialSystem;

    if (!tutorial?.isActionAllowed("placement.build")) {
      return;
    }

    const placed = this.scene.buildingManager.placeBuilding(this.recipe.id, this.gridX, this.gridY);

    if (!placed) {
      this.updatePlacement(this.gridX, this.gridY);
      return;
    }

    const itemId = this.itemId;
    const recipe = this.recipe;

    this.scene.actionSystem.payCost(recipe);
    const placedGridX = this.gridX;
    const placedGridY = this.gridY;

    this.scene.actionSystem.payCost(this.recipe);
    tutorial?.handleAction("placement.build");

    // Find the next valid position while the newly placed building
    // is already registered with BuildingManager.
    const nextPosition = this.findNearestValidPosition(itemId, placedGridX, placedGridY);

    this.finish();

    // Don't restart placement if the tutorial has moved to another step.
    const tutorialAllowsRepeat = !tutorial?.active || tutorial.isActionAllowed("placement.build");

    if (tutorialAllowsRepeat && nextPosition && this.scene.actionSystem.canAfford(BUILDINGS[itemId])) {
      this.start(itemId, nextPosition);
    }
  }

  cancel() {
    if (!this.isPlacing && !this.isMoving) return;

    const wasPlacing = this.isPlacing;
    const wasMoving = this.isMoving;

    if (wasMoving && this.movingBuilding) {
      this.movingBuilding.setVisible(true);
      this.movingBuilding.weapon?.setVisible(true);
    }

    this.finish();

    if (wasPlacing) {
      this.scene.tutorialSystem?.onPlacementCancelled();
    }

    if (wasMoving) {
      this.scene.buildingInteractionSystem?.close();
    }
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
    this.movingBuilding = null;

    this.isValid = false;

    this.mode = "normal";
  }

  update() {
    if (!this.isPlacing && !this.isMoving) return;

    this.updateControls();
  }
}
