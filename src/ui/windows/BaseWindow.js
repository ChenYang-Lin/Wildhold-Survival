export default class BaseWindow extends Phaser.GameObjects.Container {
  constructor(scene, title) {
    super(scene, 0, 0);

    this.scene = scene;
    this.title = title;

    this.background = scene.add.rectangle(0, 0, 100, 100, 0x252525, 0.95);
    this.background.setStrokeStyle(2, 0x888888);

    this.titleText = scene.add.text(0, 0, title, {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.add([this.background, this.titleText]);

    this.setScrollFactor(0);
    this.setDepth(1000);

    scene.add.existing(this);

    // Listen for screen resizing
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
  }

  initializeLayout() {
    this.updateLayout();
  }

  updateLayout() {
    const screenWidth = this.scene.scale.width;
    const screenHeight = this.scene.scale.height;

    this.panelWidth = Math.min(screenWidth * 0.94, 1100);
    this.panelHeight = Math.min(screenHeight * 0.9, 720);

    this.setPosition(screenWidth / 2, screenHeight / 2);

    this.background.setSize(this.panelWidth, this.panelHeight);

    this.titleText.setPosition(-this.panelWidth / 2 + 20, -this.panelHeight / 2 + 15);
  }

  destroy(fromScene) {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);

    super.destroy(fromScene);
  }
}
