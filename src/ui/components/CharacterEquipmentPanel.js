import EquipmentSlot from "./EquipmentSlot.js";

export default class CharacterEquipmentPanel {
  constructor(scene, container, onSlotSelect) {
    this.scene = scene;
    this.container = container;
    this.onSlotSelect = onSlotSelect;

    this.container.innerHTML = `
      <section class="character-display">
        <h3>Character</h3>

        <div class="character-preview">
          <canvas class="character-preview-canvas" width="32" height="64"></canvas>
        </div>

        <div class="equipment-slots left-slots"></div>
        <div class="equipment-slots right-slots"></div>
      </section>

      <section class="stats-panel">
        <h3>Character Stats</h3>
        <div class="stats-grid"></div>
      </section>
    `;

    this.statDefinitions = [
      { key: "damage", label: "Attack Damage" },
      { key: "attackSpeed", label: "Attack Speed" },
      { key: "speed", label: "Movement Speed" },
      { key: "maxHealth", label: "Maximum Health" },
      { key: "critDamage", label: "Critical Damage" },
      { key: "critChance", label: "Critical Chance" },
    ];

    this.statElements = {};

    const statsGrid = this.container.querySelector(".stats-grid");

    for (const stat of this.statDefinitions) {
      const row = document.createElement("div");

      row.className = "stat-row";

      row.innerHTML = `
        <span class="stat-label"></span>
        <span class="stat-value">-</span>
      `;

      row.querySelector(".stat-label").textContent = stat.label;

      statsGrid.appendChild(row);

      this.statElements[stat.key] = row.querySelector(".stat-value");
    }

    this.slotDefinitions = [
      { type: "helmet", label: "Helmet", side: "left" },
      { type: "armor", label: "Armor", side: "left" },
      { type: "weapon", label: "Weapon", side: "right" },
      { type: "boots", label: "Boots", side: "right" },
    ];

    this.equipmentSlots = {};

    for (const definition of this.slotDefinitions) {
      const slotContainer = this.container.querySelector(definition.side === "left" ? ".left-slots" : ".right-slots");

      this.equipmentSlots[definition.type] = new EquipmentSlot(this.scene, slotContainer, definition.type, definition.label, (type, itemId) => {
        this.onSlotSelect?.(type, itemId);
      });
    }
  }

  refreshCharacterPreview() {
    const canvas = this.container.querySelector(".character-preview-canvas");
    const context = canvas.getContext("2d");

    const frame = this.scene.textures.getFrame("survivor", "survivor_idle_down_0");

    if (!frame) {
      console.warn("Character preview frame not found.");
      return;
    }

    const image = frame.source.image;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    // Actual character position inside the 192 x 192 frame.
    const sourceX = frame.cutX + 80;
    const sourceY = frame.cutY + 64;

    context.drawImage(image, sourceX, sourceY, 32, 64, 0, 0, 32, 64);
  }

  refreshStats() {
    const stats = this.scene.player?.stats?.equipment;

    if (!stats) {
      console.warn("Player stats are unavailable.");
      return;
    }

    for (const [key, element] of Object.entries(this.statElements)) {
      const value = stats[key];

      if (value === undefined) {
        element.textContent = "-";
        continue;
      }

      switch (key) {
        case "attackSpeed":
        case "critDamage":
          element.textContent = `${value.toFixed(2)}x`;
          break;

        case "critChance":
          element.textContent = `${(value * 100).toFixed(0)}%`;
          break;

        default:
          element.textContent = value.toFixed(2).replace(/\.00$/, "");
      }
    }
  }

  refreshEquipment() {
    const equipmentSystem = this.scene.equipmentSystem;

    if (!equipmentSystem) return;

    for (const [type, slot] of Object.entries(this.equipmentSlots)) {
      const itemId = equipmentSystem.getEquippedItemId(type);

      slot.setItem(itemId, Boolean(itemId));
    }
  }
}
