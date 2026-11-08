// Entities
import Archer from "../entities/Archer.js";
import Tower from "../entities/Tower.js";
import Goblin from "../entities/Goblin.js";
import GoblinTank from "../entities/GoblinTank.js";
import GoblinShaman from "../entities/GoblinShaman.js";
import Player from "../player/Player.js";

// Systems
import WaveManager from "../systems/WaveManager.js";
import InputController from "../input/InputController.js";
import ActionSystem from "../systems/ActionSystem.js";
import BuildingManager from "../systems/BuildingManager.js";
import BuildingInteractionSystem from "../systems/BuildingInteractionSystem.js";
import CombatSystem from "../systems/CombatSystem.js";
import DamageTextSystem from "../systems/DamageTextSystem.js";
import SpellEffectSystem from "../systems/SpellEffectSystem.js";
import DayNightSystem from "../systems/DayNightSystem.js";
import EquipmentSystem from "../systems/EquipmentSystem.js";
import HotbarSystem from "../systems/HotbarSystem.js";
import InventorySystem from "../systems/InventorySystem.js";
import LightingSystem from "../systems/LightingSystem.js";
import QuestSystem from "../systems/QuestSystem.js";
import ResourceManager from "../systems/ResourceManger.js";
import ResourceSystem from "../systems/ResourceSystem.js";
import GameStateManager from "../systems/GameStateManager.js";
import MapManager from "../systems/MapManager.js";
import NavigationManager from "../systems/NavigationManager.js";
import PathfindingManager from "../systems/PathfindingManager.js";

// UI
import HealthUI from "../ui/HealthUI.js";
import HotbarUI from "../ui/HotbarUI.js";
import GameOverUI from "../ui/GameOverUI.js";
import OverlayMessageUI from "../ui/OverlayMessageUI.js";

// Factories
import BuffFactory from "../factories/BuffFactory.js";
import AuraFactory from "../factories/AuraFactory.js";
import StaminaUI from "../ui/StaminaUI.js";
import PlacementSystem from "../systems/PlacementSystem.js";
import MiniMapUI from "../ui/MiniMapUI.js";
import ObjectiveUI from "../ui/ObjectiveUI.js";
import TutorialSystem from "../systems/TutorialSystem.js";
import Base from "../entities/Base.js";
import EquipmentWindow from "../ui/windows/EquipmentWindow.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.cameraMode = "FOLLOW_PLAYER";
    this.cameraReturnElapsed = 0;
    this.cameraReturnStartX = 0;
    this.cameraReturnStartY = 0;

    this.DEBUG_MODE = false;
  }

  preload() {
    Player.preload(this);
    Goblin.preload(this);
    GoblinTank.preload(this);
    GoblinShaman.preload(this);
    Archer.preload(this);
    Tower.preload(this);
    this.load.atlas("campfire", "assets/building/campfire/campfire.png", "assets/building/campfire/campfire_atlas.json");
    this.load.animation("campfire_anim", "assets/building/campfire/campfire_anim.json");
    this.load.atlas("tree", "assets/tree.png", "assets/tree_atlas.json");
    this.load.image("base", "assets/base.png");
    this.load.image("wall", "assets/wall.png");
    this.load.image("spike", "assets/spike.png");
    this.load.image("wood", "assets/wood.png");
    this.load.image("rock", "assets/rock.png");
    this.load.image("stone", "assets/stone.png");
    this.load.image("health_potion", "assets/potion_2.png");
    this.load.image("stamina_potion", "assets/potion_3.png");

    this.load.atlas("equipment", "assets/equipment/equipment.png", "assets/equipment/equipment_atlas.json");

    this.load.image("arrow", "assets/arrow.png");

    // 1. Load the tileset image asset
    this.load.image("Tileset & Objects", "assets/map/Tileset & Objects.png");
    this.load.image("goblin_camp", "assets/map/goblin_camp.png");

    // 2. Load the exported Tiled JSON file
    this.load.tilemapTiledJSON("world_map", "assets/map/wildhold_survival_map.json");
  }

  create() {
    console.log("CREATE START");
    this.input.addPointer(4);
    console.log("CREATE START");

    this.mapManager = new MapManager(this);
    this.mapManager.load();

    this.createData();
    this.createEntities();
    this.createSystems();

    console.log("SYSTEMS CREATED");

    this.player.stats.refreshStats();
    this.miniMapUI = new MiniMapUI(this);

    console.log("MINIMAP CREATED");

    this.createUI();

    console.log("UI CREATED");

    this.createWorld();

    console.log("WORLD CREATED");

    // Wait for the first physics update before reading the player's body position.
    this.events.once(Phaser.Scenes.Events.POST_UPDATE, () => {
      this.cameras.main.stopFollow();
      this.cameras.main.startFollow(this.player, false, 1, 1);
      console.log("Player instance:", this.player);

      console.log("Camera follow target:", this.cameras.main._follow);

      this.questSystem.start();

      console.log(
        "Camera after first update:",
        JSON.stringify({
          playerX: this.player.x,
          playerY: this.player.y,
          playerActive: this.player.active,
          playerVisible: this.player.visible,
          bodyX: this.player.body?.x,
          bodyY: this.player.body?.y,
          cameraX: this.cameras.main.scrollX,
          cameraY: this.cameras.main.scrollY,
          cameraWidth: this.cameras.main.width,
          cameraHeight: this.cameras.main.height,
          zoom: this.cameras.main.zoom,
          following: this.cameras.main._follow ? "Yes" : "No",
        }),
      );
    });

    // For fixing the HealthUI and staminaUI jittering bug.
    // Using Math.round() to fix the healthbar jittering bug; make sure rounding doesn't slow down the player's speed
    this.playerRemainderX = 0;
    this.playerRemainderY = 0;
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updatePlayerUIPosition, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // Set boundry ----------------------------------------------------------------------------------------------------------
    const bounds = this.mapManager.getWorldBounds();
    this.physics.world.setBounds(0, 0, bounds.width, bounds.height);
    this.cameras.main.setBounds(0, 0, bounds.width, bounds.height);
    this.player.setCollideWorldBounds(true);

    // Camera ----------------------------------------------------------------------------------------------------------
    this.cameras.main.startFollow(this.player, false, 1, 1);
    this.cameras.main.roundPixels = true;

    this.setupCollisions();

    console.log("COLLISIONS CREATED");

    // const path = this.pathfindingManager.findPath(37, 29, 48, 38);

    this.input.keyboard.on("keydown-P", (e) => {
      this.pathfindingManager.toggleDebugTileBlock();
    });

    this.input.keyboard.on("keydown-O", () => {
      this.buildingManager.testMoveBuilding();
    });
  }

  createEntities() {
    this.player = new Player(this, 32, 32);
    // this.player.moveToGrid(45, 46);
    this.player.moveToGrid(45, 20);
    this.base = new Base(this, 32, 32);
    this.base.moveToGrid(45, 47);
  }

  createSystems() {
    this.inventorySystem = new InventorySystem(this);
    this.inputController = new InputController(this);
    this.actionSystem = new ActionSystem(this, this.player, this.inputController); // prettier-ignore
    this.buildingManager = new BuildingManager(this);

    this.buildingInteractionSystem = new BuildingInteractionSystem(this);
    this.placementSystem = new PlacementSystem(this);
    this.lightingSystem = new LightingSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.damageTextSystem = new DamageTextSystem(this);
    this.spellEffectSystem = new SpellEffectSystem(this);
    this.equipmentSystem = new EquipmentSystem(this);
    this.hotbarSystem = new HotbarSystem(this);
    this.dayNightSystem = new DayNightSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.questSystem = new QuestSystem(this);
    this.tutorialSystem = new TutorialSystem(this);
    this.resourceManager = new ResourceManager(this);
    this.waveManager = new WaveManager(this);
    this.gameStateManager = new GameStateManager(this);
    this.navigationManager = new NavigationManager(this);
    this.pathfindingManager = new PathfindingManager(this);
  }

  createUI() {
    this.hotbarUI = new HotbarUI(this);
    this.healthUI = new HealthUI(this);
    this.staminaUI = new StaminaUI(this);

    this.objectiveUI = new ObjectiveUI(this, this.questSystem);

    this.gameOverUI = new GameOverUI(this);
    this.overlayMessageUI = new OverlayMessageUI(this);

    this.equipmentWindow = new EquipmentWindow(this);

    this.inputController.resetUIPosition();
  }

  createData() {
    this.buffFactory = new BuffFactory();
    this.auraFactory = new AuraFactory();
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.combatSystem.enemies);
    this.physics.add.collider(this.player, this.base);
    this.physics.add.collider(this.player, this.buildingManager.buildings, null, (player, building) => building.texture.key !== "spike");
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.player, this.rocks);
    this.physics.add.collider(this.combatSystem.enemies, this.base);

    this.physics.add.collider(this.combatSystem.enemies, this.buildingManager.buildings, null, (enemy, building) => building.texture.key !== "spike");
    this.physics.add.overlap(this.combatSystem.enemies, this.buildingManager.buildings, (enemy, building) => {
      if (building.texture.key === "spike") {
        building.damageEnemy(enemy);
      }
    });

    this.physics.add.collider(this.combatSystem.enemies, this.trees);
    this.physics.add.overlap(this.projectiles, this.combatSystem.getEnemies(), (projectile, enemy) => {
      projectile.hit(enemy);
    });

    this.physics.add.collider(this.player, this.mapManager.layers.collision);
    this.physics.add.collider(this.combatSystem.getEnemies(), this.mapManager.layers.collision);
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

  enterFreeCamera(worldX, worldY) {
    const camera = this.cameras.main;

    this.cameraMode = "FREE_CAMERA";

    camera.stopFollow();
    camera.centerOn(worldX, worldY);
  }

  updateCameraReturn(delta) {
    if (this.cameraMode !== "RETURNING_TO_PLAYER") return;

    const camera = this.cameras.main;

    this.cameraReturnElapsed += delta;

    const progress = Phaser.Math.Clamp(this.cameraReturnElapsed / this.cameraReturnDuration, 0, 1);

    // Smooth ease-in-out.
    const easedProgress = Phaser.Math.Easing.Sine.InOut(progress);

    const targetX = this.player.x;
    const targetY = this.player.y;

    const x = Phaser.Math.Linear(this.cameraReturnStartX, targetX, easedProgress);

    const y = Phaser.Math.Linear(this.cameraReturnStartY, targetY, easedProgress);

    camera.centerOn(x, y);

    if (progress >= 1) {
      this.cameraMode = "FOLLOW_PLAYER";
      this.cameras.main.startFollow(this.player, false, 1, 1);
    }
  }

  returnToPlayerCamera() {
    const camera = this.cameras.main;

    this.cameraMode = "RETURNING_TO_PLAYER";

    camera.stopFollow();

    this.cameraReturnStartX = camera.midPoint.x;
    this.cameraReturnStartY = camera.midPoint.y;

    this.cameraReturnElapsed = 0;
    this.cameraReturnDuration = 250;
  }

  handlePlayerCamera() {
    if (this.cameraMode !== "FREE_CAMERA") return;

    const input = this.inputController.state;

    const isMoving = input.moveVector.lengthSq() > 0 || this.player.movementFSM.state === this.player.movementFSM.STATE_DASH;

    if (isMoving) {
      this.returnToPlayerCamera();
    }
  }

  updatePlayerUIPosition() {
    const totalX = this.player.x + this.playerRemainderX;
    const totalY = this.player.y + this.playerRemainderY;

    this.player.x = Math.round(totalX);
    this.player.y = Math.round(totalY);

    this.playerRemainderX = totalX - this.player.x;
    this.playerRemainderY = totalY - this.player.y;

    this.healthUI.updateScreenPosition();
    this.staminaUI.update();
  }

  cleanup() {
    this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.updatePlayerUIPosition, this);
  }

  update(time, delta) {
    if (this.gameStateManager.isPaused()) {
      this.player.movement.stop();
      return;
    }

    if (this.gameStateManager.isGameOver()) {
      this.physics.pause();
      return;
    }

    this.actionSystem.update();
    this.inputController.update();

    // Return camera back to the player when it moves.
    this.handlePlayerCamera();

    this.player.update(delta);

    this.questSystem.update();

    this.updateCameraReturn(delta);

    this.miniMapUI.update();

    this.placementSystem.update();
    this.combatSystem.update(time, delta);

    this.staminaUI.update();

    this.dayNightSystem.update(delta);
    this.base.update();

    this.inputController.endFrame();

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
      this.restartKey.enabled = false;

      // 2. Safely trigger the restart on the next clock tick
      this.time.delayedCall(0, () => {
        this.scene.restart();
      });
    }
  }
}
