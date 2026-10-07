export default class QuestSystem {
  constructor(scene) {
    this.scene = scene;

    this.currentQuest = {
      id: "prepare_for_first_night",
      title: "Prepare for the First Night",

      objectives: [
        {
          id: "gather_wood",
          type: "collect",
          text: "Gather 10 Wood",
          target: 10,
          progress: 0,

          requirements: {
            item: "wood",
          },
        },

        {
          id: "build_first_wall",
          type: "build",
          text: "Build 1 Wall",
          target: 1,
          progress: 0,

          requirements: {
            building: "wall",
          },
        },

        {
          id: "survive_first_night",
          type: "survive",
          text: "Survive the first night",
          target: 1,
          progress: 0,
        },

        {
          id: "gather_stone",
          type: "collect",
          text: "Gather 10 Stone",
          target: 10,
          progress: 0,

          requirements: {
            item: "stone",
          },
        },

        {
          id: "build_first_tower",
          type: "build",
          text: "Build a Tower",
          target: 1,
          progress: 0,

          requirements: {
            building: "tower",
          },
        },
      ],

      currentObjectiveIndex: 0,
      completed: false,
    };
  }

  getCurrentObjective() {
    if (this.currentQuest.completed) {
      return null;
    }

    return this.currentQuest.objectives[this.currentQuest.currentObjectiveIndex] ?? null;
  }

  addProgress(amount = 1) {
    const objective = this.getCurrentObjective();

    if (!objective) return;

    objective.progress = Math.min(objective.progress + amount, objective.target);

    if (objective.progress >= objective.target) {
      this.completeCurrentObjective();
    }

    this.scene.objectiveUI?.update();
  }

  completeCurrentObjective() {
    const objective = this.getCurrentObjective();

    if (!objective) return;

    objective.progress = objective.target;

    this.currentQuest.currentObjectiveIndex++;

    if (this.currentQuest.currentObjectiveIndex >= this.currentQuest.objectives.length) {
      this.currentQuest.completed = true;
    }
  }

  addResource(itemId, amount) {
    const objective = this.getCurrentObjective();

    if (!objective) return;
    if (objective.type !== "collect") return;
    if (objective.requirements.item !== itemId) return;

    this.addProgress(amount);
  }

  onBuildingPlaced(buildingId) {
    const objective = this.getCurrentObjective();

    if (!objective) return;
    if (objective.type !== "build") return;
    if (objective.requirements.building !== buildingId) return;

    this.addProgress();
  }

  onSurviveNight() {
    const objective = this.getCurrentObjective();

    if (!objective) return;
    if (objective.type !== "survive") return;

    this.addProgress();
  }
}
