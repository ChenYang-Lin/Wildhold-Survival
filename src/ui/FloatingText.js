export default class FloatingText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, color = "#ffffff", depth) {
    super(scene, x, y, text, {
      fontSize: "16px",
      color,
      stroke: "#000000",
      strokeThickness: 3,
    });

    this.y -= 10;

    scene.add.existing(this);

    this.setDepth(y + 1);

    scene.tweens.add({
      targets: this,
      y: y - 25,
      alpha: 0,
      duration: 600,

      onComplete: () => {
        this.destroy();
      },
    });
  }
}
