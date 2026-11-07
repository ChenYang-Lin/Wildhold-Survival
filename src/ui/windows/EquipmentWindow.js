import BaseWindow from "./BaseWindow.js";
import CharacterEquipmentPanel from "../components/CharacterEquipmentPanel.js";
import EquipmentInventoryPanel from "../components/EquipmentInventoryPanel.js";
import EquipmentDetailsPanel from "../components/EquipmentDetailsPanel.js";

export default class EquipmentWindow extends BaseWindow {
  constructor(scene) {
    super(scene, "Character Equipment", EquipmentWindow.createHTML());

    this.element.classList.add("equipment-window");
    this.inventoryPanel = this.element.querySelector(".inventory-panel");
    this.infoPanel = this.element.querySelector(".info-panel");

    this.characterEquipmentPanel = new CharacterEquipmentPanel(scene, this.element.querySelector(".character-panel"), (type, itemId) => {
      if (itemId) {
        this.equipmentDetailsPanel.showItem(itemId);
      } else {
        this.equipmentDetailsPanel.showEmptySlot(type);
      }
    });

    this.equipmentInventoryPanel = new EquipmentInventoryPanel(scene, this.inventoryPanel, (itemId, category) => {
      if (itemId) {
        this.equipmentDetailsPanel.showItem(itemId);
      } else if (category) {
        this.equipmentDetailsPanel.showEmptySlot(category);
      }
    });

    this.equipmentDetailsPanel = new EquipmentDetailsPanel(scene, this.infoPanel, () => {
      this.characterEquipmentPanel.refreshStats();
      this.characterEquipmentPanel.refreshEquipment();
      this.equipmentInventoryPanel.refresh();
    });

    this.inventoryPanel.querySelector("h3").textContent = "Inventory";
    this.infoPanel.querySelector("h3").textContent = "Item Details";

    this.initialize();
  }

  static createHTML() {
    return `
      <header class="equipment-header">
        <h2>Character Equipment</h2>
        <button class="close-button" type="button" aria-label="Close">×</button>
      </header>

      <main class="equipment-content">
        <section class="equipment-panel character-panel"></section>

        <section class="equipment-panel inventory-panel">
          <h3>Inventory</h3>
        </section>

        <section class="equipment-panel info-panel">
          <h3>Item Details</h3>
        </section>
      </main>
    `;
  }

  initialize() {
    this.hide();

    // Press I to toggle the equipment window.
    this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.toggleKey.on("down", this.toggle, this);

    // Close button.
    this.onCloseClick = () => this.hide();

    this.element.querySelector(".close-button").addEventListener("click", this.onCloseClick);

    this.characterEquipmentPanel.refreshCharacterPreview();
    this.characterEquipmentPanel.refreshStats();
    this.characterEquipmentPanel.refreshEquipment();
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    if (this.destroyed) return;

    this.toggleKey?.off("down", this.toggle, this);

    this.element?.querySelector(".close-button")?.removeEventListener("click", this.onCloseClick);

    super.destroy();
  }
}
