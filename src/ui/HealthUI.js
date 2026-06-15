export default class HealthUI {
  constructor(scene) {
    this.scene = scene;

    this.playerText = scene.add.text(16, 16, "", { fontSize: "18px", color: "#ffffff" }).setScrollFactor(0); // prettier-ignore
    this.campfireText = scene.add.text(16, 40, "", { fontSize: "18px", color: "#ffffff" }).setScrollFactor(0); // prettier-ignore

    this.uiContainer = this.scene.add.container(0, 0);
    this.uiContainer.setDepth(10000);

    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(10000);

    this.uiContainer.add(this.playerText);
    this.uiContainer.add(this.campfireText);
  }

  update() {
    const player = this.scene.player;
    const campfire = this.scene.campfire;

    if (player.hp <= player.maxHP * 0.3) {
      this.playerText.setColor("#ff4444");
    } else {
      this.playerText.setColor("#ffffff");
    }

    if (campfire.hp <= campfire.maxHP * 0.3) {
      this.campfireText.setColor("#ff4444");
    } else {
      this.campfireText.setColor("#ffffff");
    }

    this.playerText.setText(`Player HP: ${player.hp}/${player.maxHP}`);
    this.campfireText.setText(`Campfire HP: ${campfire.hp}/${campfire.maxHP}`);

    this.graphics.clear();

    const playerPercent = Phaser.Math.Clamp(player.hp / player.maxHP, 0, 1);

    this.graphics.fillStyle(0x222222);
    this.graphics.fillRect(16, 70, 150, 16);

    this.graphics.fillStyle(0x00ff00);
    this.graphics.fillRect(16, 70, 150 * playerPercent, 16);

    const campfirePercent = Phaser.Math.Clamp(campfire.hp / campfire.maxHP, 0, 1); // prettier-ignore

    this.graphics.fillStyle(0x222222);
    this.graphics.fillRect(16, 100, 150, 16);

    this.graphics.fillStyle(0xffaa00);
    this.graphics.fillRect(16, 100, 150 * campfirePercent, 16);
  }
}
