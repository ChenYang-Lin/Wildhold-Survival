import Archer from "../entities/Archer.js";
import Campfire from "../entities/Campfire.js";
import Enemy from "../entities/Enemy.js";
import Player from "../entities/Player.js";
import Rock from "../entities/Rock.js";
import Tower from "../entities/Tower.js";
import Tree from "../entities/Tree.js";
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
import RockManager from "../systems/RockManager.js";
import TreeManager from "../systems/TreeManager.js";
import HealthUI from "../ui/HealthUI.js";
import HotbarUI from "../ui/HotbarUI.js";
import WaveUISystem from "../systems/WaveUISystem.js";

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
    this.load.image("tileset_objects", "assets/map/tileset_objects.png");

    // 2. Load the exported Tiled JSON file
    this.load.tilemapTiledJSON("test_map", "assets/map/test1.json");
  }

  create() {
    this.player = new Player(this, 32, 32);
    this.player.moveToGrid(20, 25);
    this.inventorySystem = new InventorySystem(this);
    this.inputController = new InputController(this);
    this.actionSystem = new ActionSystem(
      this,
      this.player,
      this.inputController,
    );
    this.buildingManager = new BuildingManager(this);
    this.ghostPreview = new GhostPreviewSystem(this);
    this.lightingSystem = new LightingSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.healthUI = new HealthUI(this);
    this.damageTextSystem = new DamageTextSystem(this);
    this.equipmentSystem = new EquipmentSystem(this);
    this.hotbarSystem = new HotbarSystem(this);
    this.hotbarUI = new HotbarUI(this);
    this.dayNightSystem = new DayNightSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.objectiveSystem = new ObjectiveSystem(this);
    this.treeManager = new TreeManager(this);
    this.rockManager = new RockManager(this);
    this.resourceManager = new ResourceManager(this);
    this.waveManager = new WaveManager(this);
    this.waveUISystem = new WaveUISystem(this);

    // Campfire
    this.campfire = new Campfire(this, 32, 32);
    this.campfire.moveToGrid(25, 25);

    // Projectile group
    this.projectiles = this.add.group({
      runChildUpdate: true,
    });
    this.enemyProjectiles = this.add.group({
      runChildUpdate: true,
    });

    this.isGameOver = false;
    this.input.addPointer(4);

    // 3. Create the tilemap data object
    const map = this.make.tilemap({ key: "test_map" });

    // 4. Link the Tiled Tileset Name to the Phaser Image Texture
    // WARNING: 'Name_In_Tiled' must exactly match the name of the tileset inside the Tiled software!
    const tileset = map.addTilesetImage("tileset_objects", "tileset_objects");

    // 5. Create your visual layers
    // 'Layer_Name_In_Tiled' must match your layer names on the right panel in Tiled
    const groundLayer = map.createLayer("Tile Layer 1", tileset, 0, 0);

    this.scale.on("resize", (gameSize) => {
      // this.lightingSystem.darkness.setSize(gameSize.width, gameSize.height);
    });

    this.trees = this.physics.add.staticGroup();
    this.rocks = this.physics.add.staticGroup();
    this.spawnResources();

    // this.ghostPreview.setBuilding("wall");
    this.input.keyboard.on("keydown-T", () => {
      console.log(this.hotbarSystem.getSelectedItem());
    });
    this.input.keyboard.on("keydown-O", () => {
      this.dayNightSystem.startDay();
    });
    this.input.keyboard.on("keydown-P", () => {
      this.dayNightSystem.startNight();
    });

    // Set boundry ----------------------------------------------------------------------------------------------------------
    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.player.setCollideWorldBounds(true);

    // Camera ----------------------------------------------------------------------------------------------------------
    this.cameras.main.startFollow(this.player, false);

    // collider
    this.physics.add.collider(this.player, this.combatSystem.enemies);
    this.physics.add.collider(this.player, this.campfire);
    this.physics.add.collider(this.player, this.buildingManager.buildings);
    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.player, this.rocks);
    this.physics.add.collider(this.combatSystem.enemies, this.buildingManager.buildings,); // prettier-ignore
    this.physics.add.collider(this.combatSystem.enemies, this.campfire);

    this.physics.add.collider(this.combatSystem.enemies, this.trees);
    this.physics.add.overlap(
      this.projectiles,
      this.combatSystem.getEnemies(),
      (projectile, enemy) => {
        projectile.hit(enemy);
      },
    );
  }

  getScreenWidth() {
    return this.scale.width;
  }

  getScreenHeight() {
    return this.scale.height;
  }

  spawnResources() {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      let x = Phaser.Math.Between(100, 1500);
      let y = Phaser.Math.Between(100, 1500);

      if (count % 2 === 0) {
        let tree = new Tree(this, x, y);
        this.trees.add(tree);
      } else {
        let rock = new Rock(this, x, y);
        this.rocks.add(rock);
      }
      count++;
    }
  }

  update(time, delta) {
    if (this.isGameOver) {
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
