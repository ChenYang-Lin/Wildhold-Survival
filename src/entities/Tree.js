import { TREE_STAGE } from "../data/treeStages.js";

export default class Tree extends Phaser.Physics.Arcade.Sprite {
  // The collider center is 80 pixels below the sprite origin.
  static FOOT_OFFSET_Y = -80; // distance from middle of the sprite to the middle of the tree trunk (middle of the collider), 32 + 32 -> top edge of the tree collider, +16 -> center of the collider

  constructor(scene, x, y) {
    super(scene, x, y, "tree", "tree_mature");

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    // Place the collider's top-left corner 48 pixels from the sprite's left edge and 160 pixels from the sprite's top edge.
    this.body.setOffset(48, 160); // 128 x 192, 32 + 16, distance from left edge to the left edge of tree trunk;  5 * 32;  distance from top edge to the top edge of tree trunk;

    this.stage = TREE_STAGE.MATURE;
    this.setStage(TREE_STAGE.MATURE);

    this.setDepth(this.body.center.y);
  }

  setGridPosition(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  setStage(stage) {
    this.stage = stage;

    switch (stage) {
      case TREE_STAGE.SPROUT:
        this.hp = 0;
        this.maxHP = 0;

        this.body.enable = false;
        this.setFrame("tree_sprout");

        break;

      case TREE_STAGE.SAPLING:
        this.hp = 1;
        this.maxHP = 1;

        this.body.enable = true;
        this.setFrame("tree_sapling");

        break;

      case TREE_STAGE.YOUNG:
        this.hp = 3;
        this.maxHP = 3;

        this.body.enable = true;
        this.setFrame("tree_young");

        break;

      case TREE_STAGE.MATURE:
        this.hp = 5;
        this.maxHP = 5;

        this.body.enable = true;
        this.setFrame("tree_mature");

        break;
    }
  }

  takeDamage(amount) {
    if (this.stage === TREE_STAGE.SPROUT) return;

    this.hp -= amount;

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ffff44"); // prettier-ignore

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.scene.resourceManager.onTreeDestroyed(this);

    let numOfDrops = 0;

    if (this.stage === TREE_STAGE.SAPLING) numOfDrops = 1;
    else if (this.stage === TREE_STAGE.YOUNG) numOfDrops = 3;
    else if (this.stage === TREE_STAGE.MATURE) numOfDrops = 5;

    this.scene.mapManager.freeTile(this.gridX, this.gridY);

    // Spawn drops
    for (let i = 0; i < numOfDrops; i++) {
      this.scene.resourceSystem.spawnDrop("wood", this.x + Phaser.Math.Between(-10, 10), this.y + Phaser.Math.Between(-10, 10), 1);
    }

    this.destroy();
  }
}
