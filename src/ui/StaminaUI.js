export default class StaminaUI {
  constructor(scene) {
    this.scene = scene;

    const isMobile = scene.sys.game.device.input.touch;

    this.radius = isMobile ? 24 : 28;
    this.arcWidth = isMobile ? 5 : 6;

    this.offsetX = isMobile ? 18 : 22;
    this.offsetY = isMobile ? -8 : -10;

    this.backgroundColor = 0x24292e;
    this.fillColor = 0xf2c230;

    // Top → bottom
    this.startAngle = Phaser.Math.DegToRad(70);
    this.endAngle = Phaser.Math.DegToRad(-70);

    this.background = scene.add.graphics();
    this.fill = scene.add.graphics();

    this.background.setDepth(9997);
    this.fill.setDepth(9998);

    this.visible = false;

    this.setVisible(false);
  }

  update() {
    const player = this.scene.player;

    if (!player || !player.stats || !player.body) {
      return;
    }

    const percent = Phaser.Math.Clamp(player.stats.staminaPercent, 0, 1);

    // Hide stamina bar when completely full.
    if (percent >= 1) {
      this.setVisible(false);
      return;
    }

    this.setVisible(true);

    const x = player.body.right + this.offsetX;
    const y = player.body.center.y + this.offsetY;

    this.background.setPosition(x, y);
    this.fill.setPosition(x, y);

    this.draw(percent);
  }

  draw(percent) {
    const drawArc = (graphics, startAngle, endAngle, color, alpha) => {
      graphics.clear();

      graphics.lineStyle(this.arcWidth, color, alpha);

      const steps = 64;

      const startX = Math.cos(startAngle) * this.radius;

      const startY = Math.sin(startAngle) * this.radius;

      graphics.beginPath();
      graphics.moveTo(startX, startY);

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        const angle = startAngle + (endAngle - startAngle) * t;

        const x = Math.cos(angle) * this.radius;

        const y = Math.sin(angle) * this.radius;

        graphics.lineTo(x, y);
      }

      graphics.strokePath();
    };

    // Background
    drawArc(this.background, this.startAngle, this.endAngle, this.backgroundColor, 0.85);

    // Stamina fill
    if (percent > 0) {
      const currentAngle = this.startAngle + (this.endAngle - this.startAngle) * percent;

      drawArc(this.fill, this.startAngle, currentAngle, this.fillColor, 1);
    } else {
      this.fill.clear();
    }
  }

  setVisible(visible) {
    this.visible = visible;

    this.background.setVisible(visible);
    this.fill.setVisible(visible);
  }

  resetUIPosition() {
    // Not needed because this is world-space UI
    // and follows the player every frame.
  }

  destroy() {
    this.background.destroy();
    this.fill.destroy();
  }
}
