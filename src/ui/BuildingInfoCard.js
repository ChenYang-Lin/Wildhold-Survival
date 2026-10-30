import { BUILDINGS } from "../data/buildings.js";

export default class BuildingInfoCard {
  constructor(scene, onClose, onRepair, onUpgrade, onMove) {
    this.scene = scene;
    this.onClose = onClose;
    this.onRepair = onRepair;
    this.onUpgrade = onUpgrade;
    this.onMove = onMove;

    this.canUpgrade = false;

    this.width = 270;
    this.height = 260;
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

    // Stats
    this.levelText = scene.add.text(12, 37, "", {
      fontSize: "13px",
      color: "#d0d0d0",
    });

    this.damageText = scene.add.text(12, 110, "", {
      fontSize: "12px",
      color: "#ffffff",
    });

    this.attackSpeedText = scene.add.text(12, 130, "", {
      fontSize: "12px",
      color: "#ffffff",
    });

    this.rangeText = scene.add.text(12, 150, "", {
      fontSize: "12px",
      color: "#ffffff",
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
    this.closeButton = scene.add.rectangle(249, 20, 30, 28, 0x454b53);

    this.closeText = scene.add
      .text(249, 20, "X", {
        fontSize: "15px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Repair button
    this.repairButton = scene.add.rectangle(50, 225, 72, 30, 0x3b7d3b).setStrokeStyle(1, 0x8fd18f);

    this.repairText = scene.add
      .text(50, 225, "REPAIR", {
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Upgrade button
    this.upgradeButton = scene.add.rectangle(135, 225, 82, 30, 0x8a6d35).setStrokeStyle(1, 0xd6b66e);

    this.upgradeText = scene.add
      .text(135, 225, "UPGRADE", {
        fontSize: "10px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Move button
    this.moveButton = scene.add.rectangle(220, 225, 72, 30, 0x356b8a).setStrokeStyle(1, 0x8fc9ed);

    this.moveText = scene.add
      .text(220, 225, "MOVE", {
        fontSize: "11px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Upgrade cost
    this.upgradeCostText = scene.add.text(12, 162, "", {
      fontSize: "11px",
      color: "#d0d0d0",
    });

    this.container.add([
      this.background,
      this.title,
      this.levelText,
      this.healthText,
      this.healthBarBackground,
      this.healthBar,
      this.closeButton,
      this.closeText,
      this.damageText,
      this.attackSpeedText,
      this.rangeText,
      this.repairButton,
      this.repairText,
      this.upgradeButton,
      this.upgradeText,
      this.moveButton,
      this.moveText,
      this.upgradeCostText,
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
    return this.containsButtonPoint(this.closeButton, screenX, screenY);
  }

  containsRepairButtonPoint(screenX, screenY) {
    return this.containsButtonPoint(this.repairButton, screenX, screenY);
  }

  containsUpgradeButtonPoint(screenX, screenY) {
    return this.containsButtonPoint(this.upgradeButton, screenX, screenY);
  }

  containsMoveButtonPoint(screenX, screenY) {
    return this.containsButtonPoint(this.moveButton, screenX, screenY);
  }

  containsButtonPoint(button, screenX, screenY) {
    if (!this.container.visible || !button?.visible) {
      return false;
    }

    const bounds = button.getBounds();

    return bounds.contains(screenX, screenY);
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
    this.healthText.setText(`Health: ${building.hp || 0} / ${building.maxHP || 0}`);

    // Health Bar
    const ratio = building.maxHP > 0 ? building.hp / building.maxHP : 0;

    const barWidth = this.width - 24;
    this.healthBar.width = barWidth * Phaser.Math.Clamp(ratio, 0, 1);

    // Combat Stats
    const hasCombatStats = Number.isFinite(building.damage) && Number.isFinite(building.fireRate) && building.fireRate > 0;

    if (hasCombatStats) {
      const attacksPerSecond = 1000 / building.fireRate;

      this.damageText.setText(`Attack damage: ${building.damage}`);
      this.attackSpeedText.setText(`Attack speed: ${attacksPerSecond.toFixed(2)} shots/sec`);
      this.rangeText.setText(`Range: ${building.range}`);
    } else {
      this.damageText.setText("");
      this.attackSpeedText.setText("");
      this.rangeText.setText("");
    }

    // Buttons
    const buildingData = BUILDINGS[building.texture.key];
    const maxLevel = buildingData?.maxLevel ?? 1;

    // Repair
    this.canRepair = this.building.maxHP > 0;
    if (this.canRepair) {
      this.repairButton.setFillStyle(0x3b7d3b);
      this.repairButton.setStrokeStyle(1, 0x8fd18f);
      this.repairText.setColor("#ffffff");
    } else {
      this.repairButton.setFillStyle(0x454b53);
      this.repairButton.setStrokeStyle(1, 0x666666);
      this.repairText.setColor("#aaaaaa");
    }

    // Upgrade
    this.canUpgrade = building.level < maxLevel && Boolean(buildingData?.upgrades?.[building.level + 1]);

    if (this.canUpgrade) {
      const nextLevel = building.level + 1;
      const upgrade = buildingData.upgrades[nextLevel];

      const costText = Object.entries(upgrade.cost)
        .map(([resource, amount]) => {
          const name = resource.charAt(0).toUpperCase() + resource.slice(1);
          return `${amount} ${name}`;
        })
        .join(", ");

      this.upgradeText.setText("UPGRADE");
      this.upgradeCostText.setText(`Upgrade cost: ${costText}`);

      this.upgradeButton.setFillStyle(0x8a6d35);
      this.upgradeButton.setStrokeStyle(1, 0xd6b66e);
      this.upgradeText.setColor("#ffffff");
    } else {
      this.upgradeText.setText("MAX");
      this.upgradeCostText.setText("Maximum level reached");

      this.upgradeButton.setFillStyle(0x454b53);
      this.upgradeButton.setStrokeStyle(1, 0x666666);
      this.upgradeText.setColor("#aaaaaa");
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
