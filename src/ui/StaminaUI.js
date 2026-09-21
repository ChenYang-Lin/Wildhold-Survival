export default class StaminaUI {
  constructor(scene) {
    this.scene = scene;

    const isMobile = scene.sys.game.device.input.touch;

    this.barWidth = isMobile ? 46 : 56;
    this.barHeight = isMobile ? 5 : 6;

    this.offsetY = isMobile ? 28 : 32;

    // --------------------------------------------------
    // SHADOW
    // --------------------------------------------------

    this.shadow = scene.add
      .rectangle(0, 2, this.barWidth + 4, this.barHeight + 4, 0x000000, 0.45)
      .setOrigin(0.5)
      .setDepth(9997);

    // --------------------------------------------------
    // BACKGROUND
    // --------------------------------------------------

    this.background = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x24292e, 0.95).setOrigin(0.5).setStrokeStyle(1, 0x343a42, 0.9).setDepth(9998);

    // --------------------------------------------------
    // FILL
    // --------------------------------------------------

    this.fill = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0xd9b63f, 1).setOrigin(0, 0.5).setDepth(9999);

    // --------------------------------------------------
    // HIGHLIGHT
    // --------------------------------------------------

    this.highlight = scene.add.rectangle(0, -1, this.barWidth, 1, 0xffffff, 0.15).setOrigin(0, 0.5).setDepth(10000);

    this.visible = false;

    this.setVisible(false);
  }

  update() {
    const player = this.scene.player;

    if (!player || !player.stats) {
      return;
    }

    const percent = Phaser.Math.Clamp(player.stats.staminaPercent, 0, 1);

    // Hide when completely full.
    if (percent >= 1) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);

    this.fill.setSize(this.barWidth * percent, this.barHeight);

    this.resetUIPosition();
  }

  setVisible(visible) {
    this.visible = visible;

    this.shadow.setVisible(visible);
    this.background.setVisible(visible);
    this.fill.setVisible(visible);
    this.highlight.setVisible(visible);
  }

  resetUIPosition() {
    const player = this.scene.player;

    if (!player || !player.body) {
      return;
    }

    const x = player.body.center.x;
    const y = player.body.top - this.offsetY;

    this.shadow.setPosition(x, y + 2);

    this.background.setPosition(x, y);

    this.fill.setPosition(x - this.barWidth / 2, y);

    this.highlight.setPosition(x - this.barWidth / 2, y - this.barHeight / 2 + 1);
  }
}
