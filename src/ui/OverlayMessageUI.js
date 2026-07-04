export default class OverlayMessageUI {
  constructor(scene) {
    this.scene = scene;

    const width = scene.scale.width;
    const height = scene.scale.height;

    // Background
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.55).setOrigin(0).setScrollFactor(0); // prettier-ignore

    // Title text
    this.title = this.scene.add
      .text(width / 2, height / 2 - 30, "", {
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
        align: "center",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // subtitle
    this.subtitle = this.scene.add
      .text(width / 2, height / 2 + 15, "", {
        fontSize: "18px",
        color: "#dddddd",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Container
    this.container = this.scene.add.container(0, 0, [this.overlay, this.title, this.subtitle]).setDepth(20000).setVisible(false); // prettier-ignore
  }

  show(title, subtitle = "") {
    this.title.setText(title);
    this.subtitle.setText(subtitle);

    this.container.setVisible(true);
  }

  hide() {
    this.container.setVisible(false);
  }
}
