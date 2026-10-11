export default class ObjectiveUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.questSystem = questSystem;

    this.text = scene.add
      .text(scene.scale.width / 2, 20, "", {
        fontSize: "18px",
        color: "#ffff00",
        align: "center",
        lineSpacing: 4,
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

  formatObjective(objective) {
    const completed = objective.progress >= objective.target;

    let text = objective.text;

    if (objective.type === "reach_destination") {
      text = "Reach the highlighted tile next to the tree";
    } else if (objective.type !== "survive") {
      text = `${text} (${Math.floor(objective.progress)}/${objective.target})`;
    }

    return completed ? `✓ ${text}` : `• ${text}`;
  }

  update() {
    const quest = this.questSystem.getCurrentQuest();

    if (!quest) {
      this.text.setText("All quests complete!");
      this.hintText.setText("");
      return;
    }

    const objectiveLines = quest.objectives.map((objective) => this.formatObjective(objective));

    this.text.setText([quest.title, ...objectiveLines].join("\n"));

    // Keep the hint below the full objective list.
    this.hintText.setY(this.text.y + this.text.height + 10);

    const hint = this.scene.tutorialSystem?.getPrompt() ?? "";
    this.hintText.setText(hint);
  }
}
