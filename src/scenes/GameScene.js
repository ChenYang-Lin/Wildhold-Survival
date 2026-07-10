// Entities
import Archer from "../entities/Archer.js";
import Campfire from "../entities/Campfire.js";
import Enemy from "../entities/Enemy.js";
import Player from "../entities/Player.js";
import Rock from "../entities/Rock.js";
import Tower from "../entities/Tower.js";
import Tree from "../entities/Tree.js";

// Systems
import WaveManager from "../systems/WaveManager.js";
import InputController from "../input/InputController.js";
import ActionSystem from "../systems/ActionSystem.js";
import BuildingManager from "../systems/BuildingManager.js";
import CombatSystem from "../systems/CombatSystem.js";
import DamageTextSystem from "../systems/DamageTextSystem.js";
import DayNightSystem from "../systems/DayNightSystem.js";
import EquipmentSystem from "../systems/EquipmentSystem.js";
import GhostPreviewSystem from "../systems/GhostPreviewSystem.js";
import HotbarSystem from "../systems/HotbarSystem.js";
import InventorySystem from "../systems/InventorySystem.js";
import LightingSystem from "../systems/LightingSystem.js";
import ObjectiveSystem from "../systems/ObjectiveSystem.js";
import ResourceManager from "../systems/ResourceManger.js";
import ResourceSystem from "../systems/ResourceSystem.js";
import GameStateManager from "../systems/GameStateManager.js";

// UI
import HealthUI from "../ui/HealthUI.js";
import HotbarUI from "../ui/HotbarUI.js";
import GameOverUI from "../ui/GameOverUI.js";
import OverlayMessageUI from "../ui/OverlayMessageUI.js";
import MapManager from "../systems/MapManager.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    Player.preload(this);
    Enemy.preload(this);
    Archer.preload(this);
    Campfire.preload(this);
    Tower.preload(this);
    this.load.atlas("tree", "assets/tree.png", "assets/tree_atlas.json");
    this.load.image("wall", "assets/wall.png");
    this.load.image("wood", "assets/wood.png");
    this.load.image("rock", "assets/rock.png");
    this.load.image("stone", "assets/stone.png");

    this.load.image("arrow", "assets/arrow.png");

    // 1. Load the tileset image asset
    this.load.image("Tileset & Objects", "assets/map/Tileset & Objects.png");
    this.load.image("goblin_camp", "assets/map/goblin_camp.png");

    // 2. Load the exported Tiled JSON file
    this.load.tilemapTiledJSON("world_map", "assets/map/wildhold_survival_map.json");
  }

  create() {
    this.input.addPointer(4);

    this.mapManager = new MapManager(this);
    this.mapManager.load();
    console.log(this.mapManager.getResourceZones("tree"));

    this.createEntities();
    this.createSystems();
    this.createUI();

    this.createWorld();

    // Set boundry ----------------------------------------------------------------------------------------------------------
    const bounds = this.mapManager.getWorldBounds();
    this.physics.world.setBounds(0, 0, bounds.width, bounds.height);
    this.cameras.main.setBounds(0, 0, bounds.width, bounds.height);
    this.player.setCollideWorldBounds(true);

    // Camera ----------------------------------------------------------------------------------------------------------
    this.cameras.main.startFollow(this.player, false);

    this.setupCollisions();
  }

  createEntities() {
    this.player = new Player(this, 32, 32);
    this.player.moveToGrid(45, 46);
    this.campfire = new Campfire(this, 32, 32);
    this.campfire.moveToGrid(45, 47);
  }

  createSystems() {
    this.inventorySystem = new InventorySystem(this);
    this.inputController = new InputController(this);
    this.actionSystem = new ActionSystem(this, this.player, this.inputController); // prettier-ignore
    this.buildingManager = new BuildingManager(this);
    this.ghostPreview = new GhostPreviewSystem(this);
    this.lightingSystem = new LightingSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.damageTextSystem = new DamageTextSystem(this);
    this.equipmentSystem = new EquipmentSystem(this);
    this.hotbarSystem = new HotbarSystem(this);
    this.dayNightSystem = new DayNightSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.objectiveSystem = new ObjectiveSystem(this);
    this.resourceManager = new ResourceManager(this);
    this.waveManager = new WaveManager(this);
    this.gameStateManager = new GameStateManager(this);
  }

  createUI() {
    this.healthUI = new HealthUI(this);
    this.hotbarUI = new HotbarUI(this);
    this.gameOverUI = new GameOverUI(this);
    this.overlayMessageUI = new OverlayMessageUI(this);
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.combatSystem.enemies);
    this.physics.add.collider(this.player, this.campfire);
    this.physics.add.collider(this.player, this.buildingManager.buildings);
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.player, this.rocks);
    this.physics.add.collider(this.combatSystem.enemies, this.buildingManager.buildings,); // prettier-ignore
    this.physics.add.collider(this.combatSystem.enemies, this.campfire);

    this.physics.add.collider(this.combatSystem.enemies, this.trees);
    this.physics.add.overlap(this.projectiles, this.combatSystem.getEnemies(), (projectile, enemy) => {
      projectile.hit(enemy);
    });

    this.physics.add.collider(this.player, this.mapManager.layers.collision);
    this.physics.add.collider(this.combatSystem.getEnemies(), this.mapManager.collisionLayer);
  }

  createWorld() {
    this.projectiles = this.add.group({
      runChildUpdate: true,
    });
    this.enemyProjectiles = this.add.group({
      runChildUpdate: true,
    });

    this.trees = this.physics.add.staticGroup();
    this.rocks = this.physics.add.staticGroup();
    this.resourceManager.spawnInitialResources();
  }

  getScreenWidth() {
    return this.scale.width;
  }

  getScreenHeight() {
    return this.scale.height;
  }

  update(time, delta) {
    if (this.gameStateManager.isPaused()) {
      this.player.stopMovement();
      return;
    }

    if (this.gameStateManager.isGameOver()) {
      this.physics.pause();
      return;
    }

    this.actionSystem.update();
    this.inputController.update();
    this.player.update();
    this.ghostPreview.update();
    this.combatSystem.update();
    this.healthUI.update();
    this.hotbarUI.update();
    this.dayNightSystem.update(delta);
    this.campfire.update();

    // update buildings that has update funtion
    this.buildingManager.buildings.children.iterate((building) => {
      if (building.update) {
        building.update();
      }
    });

    // update fog overlay
    this.lightingSystem.update();

    // Restart game
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
    }

    // Update Ghost preview for placeables (wall, etc)
    const mode = this.equipmentSystem.getMode();
    const itemId = this.hotbarSystem.getSelectedItem();

    if (mode === "build") {
      this.ghostPreview.setBuilding(itemId);
    } else {
      this.ghostPreview.hide();
    }
  }
}
