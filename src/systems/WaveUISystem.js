export default class WaveUISystem {
  constructor(scene) {
    this.scene = scene;

    this.container = this.scene.add.container(800, 500);
    this.container.setDepth(10000);
    this.container.setScrollFactor(0);
    this.container.setAlpha(0);

    this.background = this.scene.add.rectangle(0, 10, 520, 190, 0x000000, 0.7); // prettier-ignore

    this.title = this.scene.add
      .text(0, -40, "", {
        fontSize: "40px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.message = this.scene.add
      .text(0, 0, "", {
        fontSize: "22px",
        color: "#dddddd",
        align: "center",
      })
      .setOrigin(0.5);

    this.objective = this.scene.add
      .text(0, 60, "", {
        fontSize: "18px",
        color: "#ffcc66",
        align: "center",
      })
      .setOrigin(0.5);

    this.container.add([
      this.background,
      this.title,
      this.message,
      this.objective,
    ]);
    this.container.setAlpha(0);
    this.container.setScale(0.9);
  }

  show(day, message, onComplete) {
    this.title.setText(`Night ${day}`);
    this.message.setText(message);

    this.objective.setText("Protect your tent.\nSurvive the night.");

    this.container.setAlpha(0);

    this.scene.tweens.chain({
      targets: this.container,
      tweens: [
        {
          alpha: 1,
          scale: 1,
          duration: 400,
          ease: "Back.Out",
        },
        {
          alpha: 1,
          duration: 1800,
        },
        {
          alpha: 0,
          scale: 0.95,
          duration: 500,
        },
      ],
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }
}
