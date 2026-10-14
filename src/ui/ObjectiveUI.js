export default class ObjectiveUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.questSystem = questSystem;

    this.panelWidth = 300;
    this.padding = 16;
    this.gap = 10;

    this.background = scene.add.graphics();

    this.sectionText = scene.add.text(0, 0, "QUEST", {
      fontSize: "11px",
      fontStyle: "bold",
      color: "#d9bc7a",
      letterSpacing: 2,
    });

    this.titleText = scene.add.text(0, 0, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
      wordWrap: { width: this.panelWidth - this.padding * 2 },
    });

    this.objectiveText = scene.add.text(0, 0, "", {
      fontSize: "15px",
      color: "#e7e7e7",
      lineSpacing: 6,
      wordWrap: { width: this.panelWidth - this.padding * 2 },
    });

    this.hintText = scene.add.text(0, 0, "", {
      fontSize: "13px",
      color: "#b8bdc5",
      lineSpacing: 4,
      wordWrap: { width: this.panelWidth - this.padding * 2 },
    });

    this.container = scene.add.container(0, 0, [this.background, this.sectionText, this.titleText, this.objectiveText, this.hintText]);

    this.container.setScrollFactor(0).setDepth(10000);

    this.handleResize = this.handleResize.bind(this);
    scene.scale.on("resize", this.handleResize);

    this.update();
  }

  formatObjective(objective) {
    const completed = objective.progress >= objective.target;

    let text = objective.text;

    if (objective.type === "reach_destination") {
      text = "Reach the highlighted tile";
    }

    if (objective.type === "collect") {
      text = `${text}  ${Math.floor(objective.progress)}/${objective.target}`;
    } else if (objective.type !== "reach_destination" && objective.type !== "survive") {
      text = `${text}  ${Math.floor(objective.progress)}/${objective.target}`;
    }

    return completed ? `✓  ${text}` : `•  ${text}`;
  }

  update() {
    const quest = this.questSystem.getCurrentQuest();

    if (!quest) {
      this.sectionText.setText("QUEST");
      this.titleText.setText("All quests complete!");
      this.objectiveText.setText("");
      this.hintText.setText("");
      this.layoutPanel();
      return;
    }

    this.titleText.setText(quest.title);

    // Show every objective in the current quest.
    // This matters for quests that require both wood and stone.
    const objectiveLines = quest.objectives.map((objective) => this.formatObjective(objective));

    this.objectiveText.setText(objectiveLines.join("\n"));

    const hint = this.scene.tutorialSystem?.getPrompt() ?? "";
    this.hintText.setText(hint);

    this.layoutPanel();
  }

  layoutPanel() {
    const x = this.padding;
    let y = this.padding;

    this.sectionText.setPosition(x, y);
    y += this.sectionText.height + 8;

    this.titleText.setPosition(x, y);
    y += this.titleText.height + this.gap;

    if (this.objectiveText.text.length > 0) {
      this.objectiveText.setPosition(x, y);
      y += this.objectiveText.height;
    }

    if (this.hintText.text.length > 0) {
      y += this.gap;

      // Subtle separator between objectives and tutorial guidance.
      this.hintText.setPosition(x, y);
      y += this.hintText.height;
    }

    const panelHeight = y + this.padding;

    this.background.clear();

    this.background.fillStyle(0x111820, 0.88);
    this.background.fillRoundedRect(0, 0, this.panelWidth, panelHeight, 8);

    this.background.lineStyle(1, 0xc1a66b, 0.45);
    this.background.strokeRoundedRect(0, 0, this.panelWidth, panelHeight, 8);

    // Fixed to the left-middle of the screen.
    this.container.setPosition(24, Math.max(16, (this.scene.scale.height - panelHeight) / 2));
  }

  handleResize() {
    this.layoutPanel();
  }

  destroy() {
    this.scene.scale.off("resize", this.handleResize);
    this.container.destroy();
  }
}
