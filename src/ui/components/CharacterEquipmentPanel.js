export default class CharacterEquipmentPanel {
  constructor(scene, container) {
    this.scene = scene;
    this.container = container;

    // Upper section: Character display
    this.characterDisplayBackground = scene.add.rectangle(0, 0, 100, 100, 0x353535, 1);

    this.characterTitle = scene.add.text(0, 0, "Character", {
      fontSize: "18px",
      color: "#ffffff",
    });

    this.characterPreview = scene.add.sprite(0, 0, "survivor", "survivor_idle_down_0");

    this.characterPreview.setOrigin(0.5, 0.5);

    // Lower section: Character stats
    this.statsBackground = scene.add.rectangle(0, 0, 100, 100, 0x353535, 1);

    this.statsTitle = scene.add.text(0, 0, "Character Stats", {
      fontSize: "18px",
      color: "#ffffff",
    });

    container.add([this.characterDisplayBackground, this.characterTitle, this.characterPreview, this.statsBackground, this.statsTitle]);
  }

  updateLayout(x, y, width, height) {
    const displayHeight = height * 0.65;
    const statsHeight = height * 0.35;
    const gap = 8;

    // Upper section
    const displayY = y - height / 2 + displayHeight / 2;

    this.characterDisplayBackground.setPosition(x, displayY).setSize(width, displayHeight - gap);

    this.characterTitle.setPosition(x - width / 2 + 10, displayY - displayHeight / 2 + 10);

    this.characterPreview.setPosition(x, displayY);

    // Lower section
    const statsY = y + height / 2 - statsHeight / 2;

    this.statsBackground.setPosition(x, statsY).setSize(width, statsHeight - gap);

    this.statsTitle.setPosition(x - width / 2 + 10, statsY - statsHeight / 2 + 10);
  }
}
