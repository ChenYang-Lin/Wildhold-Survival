import { HUD_CONFIG } from "../data/hudConfig.js";

export default class HealthUI {
  constructor(scene) {
    this.scene = scene;

    // --------------------------------------------------
    // RESPONSIVE CONFIG
    // --------------------------------------------------

    const isMobile = scene.sys.game.device.input.touch;

    this.config = isMobile ? HUD_CONFIG.mobile : HUD_CONFIG.desktop;

    // --------------------------------------------------
    // SIZE
    // --------------------------------------------------

    this.barWidth = this.config.panelWidth;
    this.barHeight = this.config.healthHeight;

    // --------------------------------------------------
    // SHADOW
    // --------------------------------------------------

    this.shadow = scene.add
      .rectangle(0, 3, this.barWidth + 8, this.barHeight + 8, 0x000000, 0.45)
      .setScrollFactor(0)
      .setDepth(9997);

    // --------------------------------------------------
    // OUTER FRAME
    // --------------------------------------------------

    this.outer = scene.add
      .rectangle(0, 0, this.barWidth + 6, this.barHeight + 6, 0x101318, 1)
      .setStrokeStyle(1, 0x555d66, 0.9)
      .setScrollFactor(0)
      .setDepth(9998);

    // --------------------------------------------------
    // BAR BACKGROUND
    // --------------------------------------------------

    this.background = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x24292e, 1).setStrokeStyle(1, 0x343a42, 0.9).setScrollFactor(0).setDepth(9999);

    // --------------------------------------------------
    // HEALTH FILL
    // --------------------------------------------------

    this.fill = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, 0x44cc44, 1).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10000);

    // --------------------------------------------------
    // INNER HIGHLIGHT
    // --------------------------------------------------

    this.highlight = scene.add.rectangle(0, -5, this.barWidth, 2, 0xffffff, 0.12).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10001);

    // --------------------------------------------------
    // TEXT
    // --------------------------------------------------

    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: isMobile ? "11px" : "13px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10002);

    this.resetUIPosition();
  }

  update() {
    const player = this.scene.player;

    const percent = Phaser.Math.Clamp(player.health.hp / player.health.maxHP, 0, 1);

    // --------------------------------------------------
    // FILL
    // --------------------------------------------------

    this.fill.setSize(this.barWidth * percent, this.barHeight);

    // --------------------------------------------------
    // COLOR
    // --------------------------------------------------

    if (percent <= 0.3) {
      this.fill.setFillStyle(0xff4444);
      this.outer.setStrokeStyle(1, 0xff5555, 0.9);
    } else if (percent <= 0.6) {
      this.fill.setFillStyle(0xe0a83b);
      this.outer.setStrokeStyle(1, 0xc99a3a, 0.9);
    } else {
      this.fill.setFillStyle(0x44cc44);
      this.outer.setStrokeStyle(1, 0x555d66, 0.9);
    }

    // --------------------------------------------------
    // TEXT
    // --------------------------------------------------

    this.text.setText(`HP ${player.health.hp}/${player.health.maxHP}`);

    this.resetUIPosition();
  }

  resetUIPosition() {
    const hotbarUI = this.scene.hotbarUI;

    if (!hotbarUI) {
      return;
    }

    const centerX = this.scene.scale.width / 2;

    const hotbarY = hotbarUI.getY();

    const gap = hotbarUI.isMobile ? 2 : 6;

    const y = hotbarY + hotbarUI.getDockHeight() / 2 + this.barHeight / 2 + gap;

    this.shadow.setPosition(centerX, y + 2);

    this.outer.setPosition(centerX, y);

    this.background.setPosition(centerX, y);

    this.fill.setPosition(centerX - this.barWidth / 2, y);

    this.highlight.setPosition(centerX - this.barWidth / 2, y - this.barHeight / 2 + 5);

    this.text.setPosition(centerX, y);
  }
}
