import { EQUIPMENT } from "../../data/equipment.js";
import { drawEquipmentIcon } from "../../utils/drawEquipmentIcon.js";

export default class EquipmentDetailsPanel {
  constructor(scene, container, onEquip) {
    this.scene = scene;
    this.container = container;
    this.onEquip = onEquip;
    this.selectedItemId = null;

    this.createHTML();
  }

  createHTML() {
    this.container.innerHTML += `
      <div class="equipment-details">
        <div class="details-item">
          <canvas class="details-icon" width="96" height="96"></canvas>
          <h4 class="details-name">Select an item</h4>
          <span class="details-type"></span>
        </div>

        <div class="details-bonuses"></div>

        <button class="equip-button" type="button" disabled>
          Equip
        </button>
      </div>
    `;

    this.iconCanvas = this.container.querySelector(".details-icon");
    this.nameElement = this.container.querySelector(".details-name");
    this.typeElement = this.container.querySelector(".details-type");
    this.bonusesElement = this.container.querySelector(".details-bonuses");
    this.equipButton = this.container.querySelector(".equip-button");

    this.equipButton.addEventListener("click", () => {
      if (!this.selectedItemId) return;

      const success = this.scene.equipmentSystem.equipItem(this.selectedItemId);

      if (success) {
        this.onEquip?.();
        this.showItem(this.selectedItemId);
      }
    });
  }

  showItem(itemId) {
    const item = EQUIPMENT[itemId];

    if (!item) return;

    this.selectedItemId = itemId;

    this.nameElement.textContent = item.name;
    this.typeElement.textContent = item.category;

    this.refreshIcon(item);
    this.refreshBonuses(item);
    this.refreshButton();
  }

  showEmptySlot(slotType) {
    this.selectedItemId = null;

    const context = this.iconCanvas.getContext("2d");

    context.clearRect(0, 0, this.iconCanvas.width, this.iconCanvas.height);

    const labels = {
      weapon: "Weapon",
      helmet: "Helmet",
      armor: "Armor",
      pants: "Pants",
      gloves: "Gloves",
      boots: "Boots",
    };

    this.nameElement.textContent = "Empty Slot";
    this.typeElement.textContent = labels[slotType] || slotType;
    this.bonusesElement.innerHTML = "";

    this.equipButton.textContent = "Equip";
    this.equipButton.disabled = true;
  }

  refreshIcon(item) {
    drawEquipmentIcon(this.scene, this.iconCanvas, item);
  }

  refreshBonuses(item) {
    this.bonusesElement.innerHTML = "";

    const labels = {
      damage: "Attack Damage",
      attackSpeedMultiplier: "Attack Speed",
      movementSpeedMultiplier: "Movement Speed",
      maxHealth: "Maximum Health",
      critDamage: "Critical Damage",
      critChance: "Critical Chance",
    };

    for (const [key, value] of Object.entries(item.bonuses || {})) {
      if (value === 0) continue;

      const row = document.createElement("div");
      row.className = "details-bonus-row";

      const label = document.createElement("span");
      label.textContent = labels[key] || key;

      const bonus = document.createElement("span");

      switch (key) {
        case "attackSpeedMultiplier":
        case "movementSpeedMultiplier": {
          const percentage = (value - 1) * 100;
          bonus.textContent = `${percentage > 0 ? "+" : ""}${percentage.toFixed(0)}%`;
          break;
        }

        case "critChance":
        case "critDamage":
          bonus.textContent = `+${(value * 100).toFixed(0)}%`;
          break;

        default:
          bonus.textContent = `+${value}`;
      }

      row.append(label, bonus);
      this.bonusesElement.appendChild(row);
    }
  }

  refreshButton() {
    const item = EQUIPMENT[this.selectedItemId];

    if (!item) {
      this.equipButton.disabled = true;
      return;
    }

    const equippedId = this.scene.equipmentSystem.getEquippedItemId(item.category);

    const isEquipped = equippedId === this.selectedItemId;

    this.equipButton.textContent = isEquipped ? "Equipped" : "Equip";
    this.equipButton.disabled = isEquipped;
  }
}
