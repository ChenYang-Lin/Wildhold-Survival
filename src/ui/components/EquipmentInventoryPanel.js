import { EQUIPMENT } from "../../data/equipment.js";
import { drawEquipmentIcon } from "../../utils/drawEquipmentIcon.js";

export default class EquipmentInventoryPanel {
  constructor(scene, container, onSelect) {
    this.scene = scene;
    this.container = container;
    this.onSelect = onSelect;

    this.selectedItemId = null;
    this.selectedCategory = "weapon";

    this.categories = [
      { id: "weapon", label: "Weapons" },
      { id: "helmet", label: "Helmets" },
      { id: "armor", label: "Armor" },
      { id: "boots", label: "Boots" },
    ];

    this.slots = [];
    this.slotCount = 20;

    this.createGrid();
    this.refresh();
  }

  createGrid() {
    // Category tabs
    this.tabsContainer = document.createElement("div");
    this.tabsContainer.className = "equipment-category-tabs";

    for (const category of this.categories) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "equipment-category-tab";
      button.textContent = category.label;

      button.addEventListener("click", () => {
        this.selectCategory(category.id);
      });

      this.tabsContainer.appendChild(button);
    }

    this.container.appendChild(this.tabsContainer);

    // Inventory grid
    this.grid = document.createElement("div");
    this.grid.className = "equipment-inventory-grid";

    for (let i = 0; i < this.slotCount; i++) {
      const slot = document.createElement("button");

      slot.type = "button";
      slot.className = "inventory-item-slot";
      slot.dataset.index = i;

      const icon = document.createElement("canvas");
      icon.width = 48;
      icon.height = 48;

      const equippedLabel = document.createElement("span");
      equippedLabel.className = "inventory-equipped-label";
      equippedLabel.textContent = "EQUIPPED";
      equippedLabel.hidden = true;

      slot.append(icon, equippedLabel);

      slot.addEventListener("click", () => {
        const itemId = slot.dataset.itemId;

        if (itemId) {
          this.selectItem(itemId);
        }
      });

      this.grid.appendChild(slot);
      this.slots.push(slot);
    }

    this.container.appendChild(this.grid);

    this.updateTabs();
  }

  selectCategory(category) {
    if (!this.categories.some((entry) => entry.id === category)) {
      return;
    }

    this.selectedCategory = category;
    this.selectedItemId = null;

    this.updateTabs();
    this.refresh();

    // Clear the previous item's details.
    this.onSelect?.(null, category);
  }

  updateTabs() {
    const buttons = this.tabsContainer.querySelectorAll(".equipment-category-tab");

    buttons.forEach((button, index) => {
      const category = this.categories[index];

      const isActive = category.id === this.selectedCategory;

      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  refresh() {
    const ownedEquipment = this.scene.inventorySystem.getOwnedEquipment();

    const equippedItemId = this.scene.equipmentSystem.getEquippedItemId(this.selectedCategory);

    // Only display items belonging to the selected category.
    const filteredEquipment = ownedEquipment.filter((itemId) => {
      return EQUIPMENT[itemId]?.category === this.selectedCategory;
    });

    this.slots.forEach((slot, index) => {
      const itemId = filteredEquipment[index];

      const canvas = slot.querySelector("canvas");
      const equippedLabel = slot.querySelector(".inventory-equipped-label");

      slot.dataset.itemId = itemId || "";

      slot.classList.remove("selected", "equipped", "empty");

      equippedLabel.hidden = true;

      if (!itemId) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        slot.classList.add("empty");
        return;
      }

      const item = EQUIPMENT[itemId];

      if (!item) {
        slot.classList.add("empty");
        return;
      }

      drawEquipmentIcon(this.scene, canvas, item);

      const isEquipped = itemId === equippedItemId;

      equippedLabel.hidden = !isEquipped;
      slot.classList.toggle("equipped", isEquipped);

      if (itemId === this.selectedItemId) {
        slot.classList.add("selected");
      }
    });
  }

  selectItem(itemId) {
    this.selectedItemId = itemId;

    this.refresh();

    this.onSelect?.(itemId);
  }
}
