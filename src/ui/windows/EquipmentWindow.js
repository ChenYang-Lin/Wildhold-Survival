import CharacterEquipmentPanel from "../components/CharacterEquipmentPanel.js";
import BaseWindow from "./BaseWindow.js";

export default class EquipmentWindow extends BaseWindow {
  constructor(scene) {
    super(scene, "Character Equipment");

    this.characterEquipmentPanel = new CharacterEquipmentPanel(scene, this);

    this.inventoryPanel = scene.add.rectangle(0, 0, 100, 100, 0x353535, 1);

    this.infoPanel = scene.add.rectangle(0, 0, 100, 100, 0x353535, 1);

    this.add([this.inventoryPanel, this.infoPanel]);

    this.inventoryTitle = scene.add.text(0, 0, "Inventory", {
      fontSize: "18px",
      color: "#ffffff",
    });

    this.infoTitle = scene.add.text(0, 0, "Item Details", {
      fontSize: "18px",
      color: "#ffffff",
    });

    this.add([this.inventoryTitle, this.infoTitle]);

    this.initializeLayout();
  }

  updateLayout() {
    super.updateLayout();

    const padding = 15;
    const gap = 10;

    // Available space inside the window
    const contentWidth = this.panelWidth - padding * 2 - gap * 2;
    const contentHeight = this.panelHeight - 80;

    // Column proportions
    const characterWidth = contentWidth * 0.35;
    const inventoryWidth = contentWidth * 0.4;
    const infoWidth = contentWidth * 0.25;

    const contentX = -this.panelWidth / 2 + padding;
    const contentY = -this.panelHeight / 2 + 65;

    // Calculate column positions
    const characterX = contentX + characterWidth / 2;
    const inventoryX = contentX + characterWidth + gap + inventoryWidth / 2;

    const infoX = contentX + characterWidth + gap + inventoryWidth + gap + infoWidth / 2;

    // Position and resize panel backgrounds
    this.inventoryPanel.setPosition(inventoryX, contentY + contentHeight / 2);
    this.inventoryPanel.setSize(inventoryWidth, contentHeight);

    this.infoPanel.setPosition(infoX, contentY + contentHeight / 2);
    this.infoPanel.setSize(infoWidth, contentHeight);

    // Position titles

    this.inventoryTitle.setPosition(inventoryX - inventoryWidth / 2 + 10, contentY + 10);

    this.infoTitle.setPosition(infoX - infoWidth / 2 + 10, contentY + 10);

    this.characterEquipmentPanel.updateLayout(characterX, contentY + contentHeight / 2, characterWidth, contentHeight);
  }
}
