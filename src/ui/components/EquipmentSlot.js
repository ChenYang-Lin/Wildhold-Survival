import { EQUIPMENT } from "../../data/equipment.js";
import { drawEquipmentIcon } from "../../utils/drawEquipmentIcon.js";

export default class EquipmentSlot {
  constructor(scene, container, type, label, onClick) {
    this.scene = scene;

    this.type = type;
    this.onClick = onClick;
    this.itemId = null;

    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "equipment-slot";
    this.element.dataset.slotType = type;

    this.element.innerHTML = `
      <span class="slot-title"></span>
      <canvas class="slot-icon" width="48" height="48"></canvas>
      <span class="slot-item">Empty</span>
      <span class="slot-equipped" hidden>EQUIPPED</span>
    `;

    this.element.querySelector(".slot-title").textContent = label;

    container.appendChild(this.element);

    this.iconCanvas = this.element.querySelector(".slot-icon");
    this.itemElement = this.element.querySelector(".slot-item");
    this.equippedElement = this.element.querySelector(".slot-equipped");

    this.element.addEventListener("click", () => {
      this.onClick?.(this.type, this.itemId);
    });
  }

  setItem(itemId, isEquipped = false) {
    this.itemId = itemId || null;

    const item = this.itemId ? EQUIPMENT[this.itemId] : null;

    drawEquipmentIcon(this.scene, this.iconCanvas, item);

    this.itemElement.textContent = item?.name || "Empty";
    this.itemElement.hidden = Boolean(item);

    this.equippedElement.hidden = !isEquipped;

    this.element.classList.toggle("has-item", Boolean(item));
    this.element.classList.toggle("is-equipped", isEquipped);

    this.element.setAttribute("aria-label", `${this.type}: ${item?.name || "Empty"}${isEquipped ? ", equipped" : ""}`);
  }
}
