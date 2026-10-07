export default class ObjectiveUI {
  constructor(scene, objectiveSystem) {
    this.scene = scene;
    this.objectiveSystem = objectiveSystem;

    this.text = scene.add
      .text(scene.scale.width / 2, 20, "", {
        fontSize: "18px",
        color: "#ffff00",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10000);

    this.update();
  }

  update() {
    const objective = this.objectiveSystem.getCurrentObjective();

    if (!objective) {
      this.text.setText("Tutorial Complete");
      return;
    }

    this.text.setText(`Objective:\n${objective.text} (${objective.progress}/${objective.target})`);
  }
}
