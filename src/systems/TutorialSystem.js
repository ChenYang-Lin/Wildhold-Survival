export default class TutorialSystem {
  constructor(scene) {
    this.scene = scene;

    this.steps = [
      {
        id: "select_wall",
        instruction: "Select Wall from the hotbar.",
        allowedActions: ["hotbar.wall"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: false,
      },
      {
        id: "place_wall",
        instruction: "Drag the wall to a valid tile to position it.",
        allowedActions: ["placement.drag", "placement.cancel"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.wall", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: true,
      },
      {
        id: "build_wall",
        instruction: "Wall positioned! Press BUILD to place it.",
        allowedActions: ["placement.build", "placement.cancel"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.wall", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: true,
      },
    ];

    this.currentStepIndex = 0;
    this.active = false;
  }

  getCurrentStep() {
    if (!this.active) return null;

    return this.steps[this.currentStepIndex] ?? null;
  }

  getPrompt() {
    const quest = this.scene.questSystem?.getCurrentQuest();

    if (!quest) return "";

    if (quest.id === "explore") {
      return "Move to the yellow highlighted tile.";
    }

    if (quest.id === "gather_wood") {
      return this.scene.inputController?.state.isMobile ? "Tap ATTACK while near a tree to gather wood." : "Left-click a tree to attack it and gather wood.";
    }

    if (quest.id === "build_wall") {
      return this.getCurrentStep()?.instruction ?? "";
    }

    return "";
  }

  isActionAllowed(actionId) {
    if (!this.active) return true;

    const step = this.getCurrentStep();

    if (!step) return true;

    if (step.restrictedActions.includes(actionId)) {
      return false;
    }

    return step.allowedActions.includes(actionId);
  }

  setAttackHint(enabled) {
    this.scene.inputController?.attackButtonUI?.setTutorialHighlight(enabled);
  }

  handleAction(actionId) {
    const step = this.getCurrentStep();

    if (!step) return;

    if (!step.allowedActions.includes(actionId)) {
      console.log("Tutorial action rejected:", actionId);
      return;
    }

    this.completeCurrentStep();
  }

  onPlacementCancelled() {
    const step = this.getCurrentStep();

    if (!step) return;

    if (step.id !== "place_wall" && step.id !== "build_wall") {
      return;
    }

    this.restartCurrentTutorialStep();
  }

  refreshPrompt() {
    this.scene.objectiveUI?.update();
  }

  start() {
    if (this.active) return;

    this.currentStepIndex = 0;
    this.active = true;

    console.log("Wall tutorial started");
    this.refreshPrompt();
  }

  completeCurrentStep() {
    const step = this.getCurrentStep();

    if (!step) return;

    console.log(`Tutorial step complete: ${step.id}`);

    this.currentStepIndex++;

    if (this.currentStepIndex >= this.steps.length) {
      this.active = false;
      console.log("Tutorial complete");
    }

    this.refreshPrompt();
  }

  restartCurrentTutorialStep() {
    this.currentStepIndex = 0;

    console.log("Tutorial restarted: select_wall");
    this.refreshPrompt();
  }
}
