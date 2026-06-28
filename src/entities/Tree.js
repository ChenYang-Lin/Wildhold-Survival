import { TREE_STAGE } from "../data/treeStages.js";

export default class Tree extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "tree");

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this, true);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(48, 160); // 128 x 192, 32 + 16, 160 + 0

    this.stage = TREE_STAGE.TREE;
    this.setStage(TREE_STAGE.TREE);

    this.setDepth(this.body.center.y);
  }

  setStage(stage) {
    this.stage = stage;

    switch (stage) {
      case TREE_STAGE.SPROUT:
        this.hp = 0;
        this.maxHP = 0;

        this.body.enable = false;
        this.setScale(0.4);

        break;

      case TREE_STAGE.SAPLING:
        this.hp = 2;
        this.maxHP = 2;

        this.body.enable = true;

        this.setScale(0.7);

        break;

      case TREE_STAGE.TREE:
        this.hp = 5;
        this.maxHP = 5;

        this.body.enable = true;

        this.setScale(1);

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
    this.scene.treeManager.onTreeDestroyed(this);

    // Spawn drops
    for (let i = 0; i < 3; i++) {
      this.scene.resourceSystem.spawnDrop(
        "wood",
        this.x + Phaser.Math.Between(-10, 10),
        this.y + Phaser.Math.Between(-10, 10),
        1,
      );
    }

    this.destroy();
  }
}
