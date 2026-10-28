export default class Base extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "base");

    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);

    // The sprite is 96x96, but the occupied area is 96x64.
    this.body.setSize(96, 64);
    this.body.setOffset(0, 32);
    this.body.setImmovable(true);
    this.body.moves = false;

    this.maxHP = 50;
    this.hp = this.maxHP;

    this.setDepth(this.body.bottom);
  }

  moveToGrid(gridX, gridY) {
    const config = {
      spriteWidth: 96,
      spriteHeight: 96,
      footprintWidth: 96,
      footprintHeight: 64,
    };

    const x = gridX * 32 + config.footprintWidth / 2 + (config.spriteWidth - config.footprintWidth) / 2;

    const y = gridY * 32 + config.footprintHeight / 2 + (config.spriteHeight - config.footprintHeight) / 2;

    this.setPosition(x, y);
    this.body.reset(x, y);
    this.setDepth(this.body.bottom);
  }

  takeDamage(amount, source) {
    if (!this.active || this.scene.gameStateManager.isGameOver()) {
      return;
    }

    this.hp = Phaser.Math.Clamp(this.hp - amount, 0, this.maxHP);

    this.setTint(0xff4444);

    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.scene.gameStateManager.isGameOver()) {
      return;
    }

    this.scene.gameStateManager.gameOver();
    this.scene.gameOverUI.showGameOverScreen("BASE DESTROYED\nGAME OVER");
  }

  update() {
    if (!this.active) return;

    this.setDepth(this.body.bottom);
  }
}
