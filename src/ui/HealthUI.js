export default class HealthUI {
  constructor(scene) {
    this.scene = scene;

    this.barWidth = 180;
    this.barHeight = 18;

    this.background = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x222222).setScrollFactor(0).setDepth(10000);

    this.fill = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x44cc44).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10001);

    this.text = scene.add
      .text(0, 0, "", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10002);

    this.resetUIPosition();
  }

  update() {
    const player = this.scene.player;

    const percent = Phaser.Math.Clamp(player.health.hp / player.health.maxHP, 0, 1);

    this.fill.setSize(this.barWidth * percent, this.barHeight);

    this.text.setText(`HP ${player.health.hp}/${player.health.maxHP}`);

    if (percent <= 0.3) {
      this.fill.setFillStyle(0xff4444);
    } else {
      this.fill.setFillStyle(0x44cc44);
    }

    this.resetUIPosition();
  }

  resetUIPosition() {
    const centerX = this.scene.scale.width / 2;
    const y = this.scene.scale.height - 25;

    this.background.setPosition(centerX, y);

    this.fill.setPosition(centerX - this.barWidth / 2, y);

    this.text.setPosition(centerX, y);
  }
}
