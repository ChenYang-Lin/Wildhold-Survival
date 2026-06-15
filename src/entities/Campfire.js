export default class Campfire extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "campfire", "campfire_idle");
    this.scene = scene;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.body.setImmovable(true);
    this.body.moves = false;

    this.setOrigin(0.5, 0.5);
    this.body.setSize(32, 32);
    this.body.setOffset(16, 32); // 64 x 64, 0 + 16, 32 + 0

    this.hp = 20;
    this.maxHP = this.hp;

    this.visionRadius = 300;
    this.baseVisionRadius = 300;

    this.anims.play(`campfire_idle`);

    this.setDepth(this.body.center.y);
  }

  static preload(scene) {
    scene.load.atlas("campfire", "assets/building/campfire/campfire.png", "assets/building/campfire/campfire_atlas.json"); // prettier-ignore
    scene.load.animation("campfire_anim", "assets/building/campfire/campfire_anim.json"); // prettier-ignore
  }

  moveToGrid(gridX, gridY) {
    const worldX = gridX * 32 + 16;
    const worldY = gridY * 32 + 16;

    this.moveToPosition(worldX, worldY);
  }

  moveToPosition(x, y) {
    // centerOffsetX = x - (bodyOffsetX + bodyWidth / 2 - spriteOriginOffsetX)
    // centerOffsetY = y - (bodyOffsetY + bodyHeight / 2 - spriteOriginOffsetY)

    const centerOffsetX = x - (16 + 32 / 2 - 64 * 0.5);
    const centerOffsetY = y - (32 + 32 / 2 - 64 * 0.5);
    this.setPosition(centerOffsetX, centerOffsetY);
  }

  takeDamage(amount, source) {
    this.hp -= amount;

    this.setTint(0xff4444);

    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.scene.isGameOver) return;

    this.scene.isGameOver = true;
    this.scene.physics.pause();

    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;

    this.scene.add
      .text(
        this.scene.cameras.main.centerX,
        this.scene.cameras.main.centerY,
        "CAMPFIRE DESTROYED\nGAME OVER",
        {
          fontSize: "28px",
          color: "#ff0000",
          align: "center",
          stroke: "#000000",
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001);

    const restartButton = this.scene.add
      .text(centerX, centerY + 40, "RESTART", {
        fontSize: "24px",
        backgroundColor: "#333333",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10001);

    restartButton.on("pointerdown", () => {
      this.scene.scene.restart();
    });

    // dark overlay
    this.scene.add
      .rectangle(
        0,
        0,
        this.scene.cameras.main.width,
        this.scene.cameras.main.height,
        0x000000,
        0.7,
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(10000);
  }

  update() {
    const t = this.scene.time.now * 0.01;

    this.visionRadius =
      this.baseVisionRadius + Math.sin(t) * 8 + Math.sin(t * 1.7) * 5;
  }
}
