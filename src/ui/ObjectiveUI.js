export default class ObjectiveUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.questSystem = questSystem;

    this.text = scene.add
      .text(scene.scale.width / 2, 20, "", {
        fontSize: "18px",
        color: "#ffff00",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10000);

    this.hintText = scene.add
      .text(scene.scale.width / 2, 76, "", {
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#00000099",
        padding: { x: 8, y: 5 },
        align: "center",
        wordWrap: { width: scene.scale.width - 40 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10000);

    this.update();
  }

  update() {
    const quest = this.questSystem.getCurrentQuest();
    const objective = this.questSystem.getCurrentObjective();

    if (!quest || !objective) {
      this.text.setText("All quests complete!");
      this.hintText.setText("");
      return;
    }

    let objectiveText = objective.text;

    // A destination is a one-time action, so don't show a confusing 0/1.
    if (objective.type === "reach_destination") {
      objectiveText = "Reach the highlighted tile next to the tree";
    } else if (objective.type === "collect") {
      objectiveText = `${objective.text} (${Math.floor(objective.progress)}/${objective.target})`;
    } else if (objective.type === "build") {
      objectiveText = `${objective.text} (${Math.floor(objective.progress)}/${objective.target})`;
    } else if (objective.type === "kill" || objective.type === "survive") {
      objectiveText = `${objective.text} (${Math.floor(objective.progress)}/${objective.target})`;
    }

    this.text.setText(`${quest.title}\n${objectiveText}`);

    const hint = this.scene.tutorialSystem?.getPrompt() ?? "";
    this.hintText.setText(hint);
  }
}
