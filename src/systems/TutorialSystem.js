export default class TutorialSystem {
  constructor(scene) {
    this.scene = scene;

    this.steps = [
      {
        id: "select_wall",
        instruction: "Select Wall",
        allowedActions: ["hotbar.wall"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: false,
      },
      {
        id: "place_wall",
        instruction: "Move the Wall into position",
        allowedActions: ["placement.drag", "placement.cancel"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.wall", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: true,
      },
      {
        id: "build_wall",
        instruction: "Press BUILD",
        allowedActions: ["placement.build", "placement.cancel"],
        restrictedActions: ["player.move", "combat.attack", "player.dash", "hotbar.wall", "hotbar.tower", "hotbar.healthPotion", "hotbar.staminaPotion"],
        pauseSimulation: true,
      },
    ];

    this.currentStepIndex = 0;
    this.active = true;
  }

  getCurrentStep() {
    if (!this.active) return null;

    return this.steps[this.currentStepIndex] ?? null;
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

  restartCurrentTutorialStep() {
    this.currentStepIndex = 0;

    console.log("Tutorial restarted: select_wall");
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
  }
}
