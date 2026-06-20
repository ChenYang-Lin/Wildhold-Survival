export default class InventorySystem {
  constructor(scene) {
    this.scene = scene;

    this.inventory = [
      { id: "wood", amount: 50 },
      { id: "stone", amount: 20 },
      { id: "apple", amount: 3 },
    ];

    this.inventoryText = this.scene.add
      .text(scene.scale.width - 150, 20, "", {
        fontSize: "16px",
        fill: "#ffffff",
      })
      .setScrollFactor(0)
      .setDepth(10000);

    this.updateInventoryUI();
  }

  addItem(id, type, amount) {
    if (id === "wood") {
      this.scene.objectiveSystem.addWood(amount);
    }

    // stack existing
    for (let slot of this.inventory) {
      if (slot && slot.id === id) {
        slot.amount += amount;
        this.updateInventoryUI();
        return true;
      }
    }

    // find empty slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i] === null) {
        this.inventory[i] = {
          id,
          type,
          amount,
        };
        this.updateInventoryUI();
        return true;
      }
    }
  }

  removeItem(type, amount = 1) {
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];

      if (slot && slot.type === type) {
        slot.amount -= amount;

        if (slot.amount <= 0) {
          this.inventory[i] = null;
        }

        this.updateInventoryUI();
        return true;
      }
    }
    return false;
  }

  updateInventoryUI() {
    let text = "Inventory\n";

    this.inventory.forEach((slot, i) => {
      const selected = i === this.selectedSlot ? ">" : " ";

      if (slot) {
        text += `${selected}[${i + 1}] ${slot.id}: ${slot.amount}\n`;
      } else {
        text += `${selected}[${i + 1}] Empty\n`;
      }
    });

    this.inventoryText.setText(text);
  }

  hasResource(id, amount) {
    console.log(this.inventory);
    const item = this.inventory.find((i) => i?.id === id);

    if (!item) return false;

    return item.amount >= amount;
  }

  consumeResource(id, amount) {
    const item = this.inventory.find((i) => i.id === id);

    if (!item) return false;

    if (item.amount < amount) {
      return false;
    }

    item.amount -= amount;

    if (item.amount <= 0) {
      const index = this.inventory.indexOf(item);
      this.inventory[index] = null;
    }

    this.updateInventoryUI();

    return true;
  }
}
