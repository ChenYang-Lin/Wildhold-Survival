export default class ObjectiveUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.questSystem = questSystem;

    this.panelWidth = 260;
    this.padding = 4;
    this.gap = 5;

    this.background = scene.add.graphics();

    this.questIcon = scene.add
      .text(0, 0, "◆", {
        fontFamily: "Arial, sans-serif",
        fontSize: "17px",
        color: "#f4c75b",
        stroke: "#5b3d12",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.titleText = scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#ffffff",
      wordWrap: {
        width: this.panelWidth - this.padding * 2 - 20,
      },
      stroke: "#111820",
      strokeThickness: 3,
    });

    // Gold underline beneath the title.
    this.titleUnderline = scene.add.graphics();

    this.objectiveText = scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      lineSpacing: 3,
      wordWrap: {
        width: this.panelWidth - this.padding * 2,
      },
      stroke: "#111820",
      strokeThickness: 2,
    });

    this.hintText = scene.add.text(0, 0, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#e0e5ed",
      lineSpacing: 2,
      wordWrap: {
        width: this.panelWidth - this.padding * 2,
      },
      stroke: "#111820",
      strokeThickness: 2,
    });

    this.container = scene.add.container(0, 0, [this.background, this.questIcon, this.titleText, this.titleUnderline, this.objectiveText, this.hintText]);

    this.container.setScrollFactor(0).setDepth(10000);

    // Animate the icon gently while a quest is active.
    this.iconTween = scene.tweens.add({
      targets: this.questIcon,
      scaleX: 1.12,
      scaleY: 1.12,
      alpha: 0.75,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Tap the tracker to expand/collapse the hint.
    this.container.setSize(this.panelWidth, 80);
    this.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.panelWidth, 80), Phaser.Geom.Rectangle.Contains);

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

    if (objective.type === "collect" || (objective.type !== "reach_destination" && objective.type !== "survive")) {
      text = `${text}  ${Math.floor(objective.progress)}/${objective.target}`;
    }

    return completed ? `✓ ${text}` : `• ${text}`;
  }

  update() {
    const quest = this.questSystem.getCurrentQuest();
    const hint = this.scene.tutorialSystem?.getPrompt() ?? "";

    this.hintText.setText(hint);
    this.hintText.setVisible(hint.length > 0);

    if (!quest) {
      this.questIcon.setVisible(false);
      this.titleText.setText("All quests complete!");
      this.objectiveText.setText("");
      this.layoutPanel();
      return;
    }

    this.questIcon.setVisible(true);
    this.titleText.setText(quest.title);

    const objectiveLines = quest.objectives.map((objective) => this.formatObjective(objective));

    this.objectiveText.setText(objectiveLines.join("\n"));

    this.layoutPanel();
  }

  layoutPanel() {
    const x = this.padding;
    let y = this.padding;

    this.questIcon.setPosition(x + 8, y + 8);
    this.titleText.setPosition(x + 22, y);

    // Reserve space for the title before drawing the underline.
    y += this.titleText.height + 3;

    // Thicker gold underline.
    this.titleUnderline.clear();

    const underlineWidth = Math.min(this.titleText.width, this.panelWidth - x - 22);

    this.titleUnderline.fillStyle(0xd6b45e, 1);
    this.titleUnderline.fillRoundedRect(x + 22, y, underlineWidth, 3, 1);

    y += 8;

    // Objectives.
    if (this.objectiveText.text.length > 0) {
      this.objectiveText.setPosition(x, y);
      y += this.objectiveText.height;
    }

    // Always position the hint, even when hidden.
    y += this.gap;
    this.hintText.setPosition(x, y);

    if (this.hintText.visible && this.hintText.text.length > 0) {
      y += this.gap;
      this.hintText.setPosition(x, y);
      y += this.hintText.height;
    }

    this.background.clear();

    const miniMap = this.scene.miniMapUI;
    const objectiveY = miniMap ? miniMap.margin + miniMap.panelHeight + 10 : 122;

    this.container.setPosition(12, objectiveY);

    // Make the hit area cover the visible tracker content.
    const hitHeight = Math.max(44, y + this.padding);

    this.container.setSize(this.panelWidth, hitHeight);

    if (this.container.input?.hitArea) {
      this.container.input.hitArea.setTo(0, 0, this.panelWidth, hitHeight);
    }
  }

  handleResize() {
    this.layoutPanel();
  }

  destroy() {
    this.scene.scale.off("resize", this.handleResize);

    this.iconTween?.stop();
    this.container.destroy();
  }
}
