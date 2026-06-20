export default class ObjectiveSystem {
  constructor(scene) {
    this.scene = scene;

    this.currentObjective = 0;

    this.objectives = [
      {
        id: "wood",
        text: "Gather 10 Wood",
        target: 10,
        progress: 0,
      },
      {
        id: "wall",
        text: "Build 1 Wall",
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

  addWood(amount) {
    const obj = this.getCurrentObjective();

    if (!obj) return;

    if (obj.id !== "wood") return;

    obj.progress++;

    if (obj.progress >= obj.target) {
      this.completeObjective();
    }

    this.updateUI();
    // this.woodCollected += amount;

    // if (this.woodCollected > this.woodGoal) {
    //   this.woodCollected = this.woodGoal;
    // }

    // this.updateUI();

    // if (this.woodCollected >= this.woodGoal) {
    //   console.log("Objective Complete");
    // }
  }

  onBuildingPlaced(id) {
    const obj = this.getCurrentObjective();

    if (!obj) return;

    if (obj.id !== "wall") return;

    if (id !== "wall") return;

    obj.progress++;

    if (obj.progress >= obj.target) {
      this.completeObjective();
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
}
