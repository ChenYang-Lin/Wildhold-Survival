export default class TutorialSystem {
  constructor(scene) {
    this.scene = scene;

    this.steps = [
      {
        id: "select_wall",
        instruction: "Select Wall",

        allowedActions: ["hotbar.wall"],

        pauseSimulation: false,
      },

      {
        id: "place_wall",
        instruction: "Move the Wall into position",

        allowedActions: ["placement.drag", "placement.cancel"],

        pauseSimulation: true,
      },

      {
        id: "build_wall",
        instruction: "Press BUILD",

        allowedActions: ["placement.build", "placement.cancel"],

        pauseSimulation: true,
      },
    ];

    this.currentStepIndex = 0;
    this.active = true;
  }

  getCurrentStep() {
    if (!this.active) {
      return null;
    }

    return this.steps[this.currentStepIndex] ?? null;
  }

  isActionAllowed(actionId) {
    const step = this.getCurrentStep();

    if (!step) {
      return true;
    }

    return step.allowedActions.includes(actionId);
  }

  handleAction(actionId) {
    const step = this.getCurrentStep();

    if (!step) return;

    if (!step.allowedActions.includes(actionId)) {
      return;
    }

    this.completeCurrentStep();
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
