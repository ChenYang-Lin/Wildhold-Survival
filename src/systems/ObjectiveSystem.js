export default class ObjectiveSystem {
  constructor(scene) {
    this.scene = scene;

    this.currentObjective = 0;

    this.objectives = [
      {
        type: "collect",
        item: "wood",
        text: "Gather 10 Wood",
        target: 10,
        progress: 0,
      },

      {
        type: "build",
        building: "wall",
        text: "Build 1 Wall",
        target: 1,
        progress: 0,
      },

      {
        type: "survive",
        text: "Survive the first night",
        target: 1,
        progress: 0,
      },

      {
        type: "build",
        building: "tower",
        text: "Build a tower",
        target: 1,
        progress: 0,
      },
    ];

    this.woodCollected = 0;
    this.woodGoal = 10;

    this.text = scene.add
      .text(scene.scale.width / 2, 20, "", {
        fontSize: "18px",
        color: "#ffff00",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10000);

    this.updateUI();
  }

  getCurrentObjective() {
    return this.objectives[this.currentObjective];
  }

  completeObjective() {
    this.currentObjective++;

    if (this.currentObjective >= this.objectives.length) {
      this.text.setText("Tutorial Complete");
      return;
    }

    this.updateUI();
  }

  updateUI() {
    const obj = this.getCurrentObjective();

    if (!obj) {
      this.text.setText("Tutorial Complete");
      return;
    }

    this.text.setText(
      `Objective:\n${obj.text} (${obj.progress}/${obj.target})`,
    );
  }

  advanceObjective(amount = 1) {
    const obj = this.getCurrentObjective();

    if (!obj) return;

    obj.progress += amount;

    if (obj.progress >= obj.target) {
      this.completeObjective();
    }

    this.updateUI();
  }

  addResource(itemId, amount) {
    const obj = this.getCurrentObjective();

    if (!obj) return;
    if (obj.type !== "collect") return;
    if (obj.item !== itemId) return;

    this.advanceObjective(amount);
  }

  onBuildingPlaced(id) {
    const obj = this.getCurrentObjective();

    if (!obj) return;
    if (obj.type !== "build") return;
    if (id !== obj.building) return;

    this.advanceObjective();
  }

  onSurviveNight() {
    const obj = this.getCurrentObjective();

    if (!obj) return;
    if (obj.type !== "survive") return;

    this.advanceObjective();
  }
}
