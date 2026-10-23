export default class BuildingInfoCard {
  constructor(scene, onClose, onRepair) {
    this.scene = scene;
    this.onClose = onClose;
    this.onRepair = onRepair;

    this.width = 220;
    this.height = 166;
    this.padding = 12;

    this.building = null;

    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(20000).setVisible(false);

    // Card background
    this.background = scene.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x20252b, 0.96).setStrokeStyle(2, 0xb6a27a);

    this.title = scene.add.text(12, 10, "", {
      fontSize: "17px",
      color: "#ffffff",
      fontStyle: "bold",
    });

    this.levelText = scene.add.text(12, 37, "", {
      fontSize: "13px",
      color: "#d0d0d0",
    });

    this.healthText = scene.add.text(12, 59, "", {
      fontSize: "12px",
      color: "#ffffff",
    });

    const barX = 12;
    const barY = 91;
    const barWidth = this.width - 24;
    this.healthBarBackground = scene.add.rectangle(barX, barY, barWidth, 8, 0x484848).setOrigin(0, 0.5);
    this.healthBar = scene.add.rectangle(barX, barY, barWidth, 8, 0x55cc66).setOrigin(0, 0.5);

    // Close Button
    this.closeButton = scene.add.rectangle(199, 20, 30, 28, 0x454b53);

    this.closeText = scene.add
      .text(199, 20, "X", {
        fontSize: "15px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Repair button
    this.repairButton = scene.add.rectangle(110, 140, 100, 28, 0x3b7d3b).setStrokeStyle(1, 0x8fd18f);

    this.repairText = scene.add
      .text(110, 140, "REPAIR", {
        fontSize: "12px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.container.add([
      this.background,
      this.title,
      this.levelText,
      this.healthText,
      this.healthBarBackground,
      this.healthBar,
      this.closeButton,
      this.closeText,
      this.repairButton,
      this.repairText,
    ]);
  }

  show(building) {
    this.building = building;
    this.refresh();
    this.container.setVisible(true);
    this.updatePosition();
  }

  hide() {
    this.building = null;
    this.container.setVisible(false);
  }

  containsScreenPoint(screenX, screenY) {
    if (!this.container.visible) return false;

    return screenX >= this.container.x && screenX <= this.container.x + this.width && screenY >= this.container.y && screenY <= this.container.y + this.height;
  }

  containsCloseButtonPoint(screenX, screenY) {
    if (!this.container.visible) return false;

    const buttonX = this.container.x + 199;
    const buttonY = this.container.y + 20;

    return screenX >= buttonX - 15 && screenX <= buttonX + 15 && screenY >= buttonY - 14 && screenY <= buttonY + 14;
  }

  containsRepairButtonPoint(screenX, screenY) {
    if (!this.container.visible) return false;

    const buttonX = this.container.x + 110;
    const buttonY = this.container.y + 140;

    return screenX >= buttonX - 50 && screenX <= buttonX + 50 && screenY >= buttonY - 14 && screenY <= buttonY + 14;
  }

  refresh() {
    const building = this.building;

    if (!building?.active) {
      this.hide();
      return;
    }

    const names = {
      wall: "Wall",
      tower: "Tower",
    };

    const type = building.texture.key;
    const name = names[type] ?? type;

    this.title.setText(name);
    this.levelText.setText(`Level ${building.level ?? 1}`);
    this.healthText.setText(`Health: ${building.hp} / ${building.maxHP}`);

    const ratio = building.maxHP > 0 ? building.hp / building.maxHP : 0;

    const barWidth = this.width - 24;
    this.healthBar.width = barWidth * Phaser.Math.Clamp(ratio, 0, 1);

    if (ratio <= 0.3) {
      this.healthBar.setFillStyle(0xe05252);
    } else if (ratio <= 0.6) {
      this.healthBar.setFillStyle(0xe5b84b);
    } else {
      this.healthBar.setFillStyle(0x55cc66);
    }
  }

  updatePosition() {
    const building = this.building;

    if (!building?.active || !building.body) {
      this.hide();
      return;
    }

    const camera = this.scene.cameras.main;

    const worldX = building.body.center.x;
    const worldY = building.body.top;

    const screenX = camera.x + (worldX - camera.worldView.x) * camera.zoom;

    const screenY = camera.y + (worldY - camera.worldView.y) * camera.zoom;

    const gap = 12;
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    let x = screenX + gap;

    if (x + this.width > screenWidth - 8) {
      x = screenX - this.width - gap;
    }

    let y = screenY - this.height - gap;

    if (y < 8) {
      y = screenY + gap;
    }

    x = Phaser.Math.Clamp(x, 8, Math.max(8, screenWidth - this.width - 8));

    y = Phaser.Math.Clamp(y, 8, Math.max(8, screenHeight - this.height - 8));

    this.container.setPosition(x, y);
  }

  update() {
    if (!this.container.visible || !this.building) return;

    if (!this.building.active || !this.building.body) {
      this.hide();
      return;
    }

    this.refresh();
    this.updatePosition();
  }

  destroy() {
    this.container.destroy();
  }
}
