export default class QuestSystem {
  constructor(scene) {
    this.scene = scene;

    this.quests = [
      {
        id: "explore",
        title: "Explore Your Surroundings",
        objectives: [
          {
            id: "reach_tree",
            type: "reach_destination",
            text: "Reach the highlighted tile next to the nearest tree",
            target: 1,
            progress: 0,
          },
        ],
      },
      {
        id: "gather_wood",
        title: "Gather Wood",
        objectives: [
          {
            id: "collect_wood",
            type: "collect",
            text: "Gather 10 Wood",
            target: 10,
            progress: 0,
            requirements: { item: "wood" },
          },
        ],
      },
      {
        id: "build_wall",
        title: "Build Your First Wall",
        objectives: [
          {
            id: "build_first_wall",
            type: "build",
            text: "Build 1 Wall",
            target: 1,
            progress: 0,
            requirements: { building: "wall" },
          },
        ],
      },
      {
        id: "kill_enemy",
        title: "Defeat Your First Enemy",
        objectives: [
          {
            id: "kill_first_enemy",
            type: "kill",
            text: "Defeat the enemy",
            target: 1,
            progress: 0,
          },
        ],
      },
      {
        id: "protect_tent",
        title: "Protect the Tent",
        objectives: [
          {
            id: "survive_first_night",
            type: "survive",
            text: "Protect the tent and survive the night",
            target: 1,
            progress: 0,
          },
        ],
      },
    ];

    this.currentQuestIndex = 0;
    this.currentObjectiveIndex = 0;
    this.completed = false;
  }

  getCurrentQuest() {
    if (this.completed) return null;

    return this.quests[this.currentQuestIndex] ?? null;
  }

  getCurrentObjective() {
    const quest = this.getCurrentQuest();

    if (!quest) return null;

    return quest.objectives[this.currentObjectiveIndex] ?? null;
  }

  start() {
    if (this.started) return;

    this.started = true;
    this.startCurrentQuest();
  }

  startCurrentQuest() {
    const quest = this.getCurrentQuest();

    if (!quest) {
      this.completed = true;
      this.scene.events.emit("quests:completed");
      this.scene.objectiveUI?.update();
      return;
    }

    if (quest.id === "explore") {
      this.setDestinationTarget(this.findNearestTreeDestination());
    } else {
      this.clearDestinationTarget();
    }

    this.scene.tutorialSystem?.setAttackHint(quest.id === "gather_wood");

    console.log(`Quest started: ${quest.id}`);

    if (quest.id === "build_wall") {
      this.scene.tutorialSystem?.start();
    }

    if (quest.id === "protect_tent") {
      this.scene.dayNightSystem.startCycle();
    }

    this.scene.events.emit("quest:started", quest);
    this.scene.objectiveUI?.update();
  }

  findNearestTreeDestination() {
    const trees = this.scene.trees.getChildren();
    const player = this.scene.player;
    const mapManager = this.scene.mapManager;

    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 }, // Right
    ];

    const playerPosition = mapManager.worldToGrid(player.body.center.x, player.body.center.y);

    let nearestTree = null;
    let nearestTreeDistance = Infinity;

    // First: find the nearest tree by its logical map tile.
    for (const tree of trees) {
      if (!tree.active) continue;

      const distance = Phaser.Math.Distance.Between(playerPosition.gridX, playerPosition.gridY, tree.gridX, tree.gridY);

      if (distance < nearestTreeDistance) {
        nearestTreeDistance = distance;
        nearestTree = tree;
      }
    }

    if (!nearestTree) return null;

    // Second: choose the closest available orthogonal tile
    // next to that specific tree.
    let destination = null;
    let nearestDestinationDistance = Infinity;

    for (const direction of directions) {
      const gridX = nearestTree.gridX + direction.x;
      const gridY = nearestTree.gridY + direction.y;

      if (mapManager.isTileBlocked(gridX, gridY)) continue;

      const distance = Phaser.Math.Distance.Between(playerPosition.gridX, playerPosition.gridY, gridX, gridY);

      if (distance < nearestDestinationDistance) {
        nearestDestinationDistance = distance;
        destination = { gridX, gridY };
      }
    }

    // If the nearest tree is surrounded, don't silently select a
    // different tree. This makes the situation easier to diagnose.
    if (!destination) {
      console.warn("Nearest tree has no available adjacent tile:", nearestTree.gridX, nearestTree.gridY);
      return null;
    }

    console.log("Nearest tree:", {
      gridX: nearestTree.gridX,
      gridY: nearestTree.gridY,
      distanceInTiles: nearestTreeDistance,
      destination,
    });

    return destination;
  }

  setDestinationTarget(tile) {
    this.targetDestination = tile;
    this.destinationMarker?.destroy();
    this.destinationMarker = null;

    if (!tile) return;

    const { x, y } = this.scene.mapManager.gridToWorld(tile.gridX, tile.gridY);

    // Highlight the destination tile, not the tree.
    this.destinationMarker = this.scene.add
      .rectangle(x + 16, y + 16, 28, 28, 0xffff00, 0.3)
      .setStrokeStyle(3, 0xffff00, 1)
      .setDepth(9998);
  }

  clearDestinationTarget() {
    this.destinationMarker?.destroy();
    this.destinationMarker = null;
    this.targetDestination = null;
  }

  update() {
    const objective = this.getCurrentObjective();

    if (!objective || objective.type !== "reach_destination") {
      return;
    }

    // Retry if no suitable tile was available earlier.
    if (!this.targetDestination) {
      this.setDestinationTarget(this.findNearestTreeDestination());
    }

    const tile = this.targetDestination;
    if (!tile) return;

    const { x, y } = this.scene.mapManager.gridToWorld(tile.gridX, tile.gridY);

    const player = this.scene.player;
    const centerX = player.body.center.x;
    const centerY = player.body.center.y;

    const reached = centerX >= x && centerX < x + 32 && centerY >= y && centerY < y + 32;

    if (reached) {
      this.clearDestinationTarget();
      this.addProgress(1);
    }
  }

  addProgress(amount = 1) {
    const objective = this.getCurrentObjective();

    if (!objective || amount <= 0) return;

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

    console.log(`Objective complete: ${objective.id}`);

    const quest = this.getCurrentQuest();

    this.currentObjectiveIndex++;

    if (this.currentObjectiveIndex >= quest.objectives.length) {
      this.completeCurrentQuest();
    }
  }

  completeCurrentQuest() {
    const quest = this.getCurrentQuest();

    if (!quest) return;

    console.log(`Quest complete: ${quest.id}`);

    this.scene.events.emit("quest:completed", quest);

    this.currentQuestIndex++;
    this.currentObjectiveIndex = 0;

    this.startCurrentQuest();
  }

  addResource(itemId, amount) {
    const objective = this.getCurrentObjective();

    if (!objective || objective.type !== "collect") return;
    if (objective.requirements?.item !== itemId) return;

    this.addProgress(amount);
  }

  onBuildingPlaced(buildingId) {
    const objective = this.getCurrentObjective();

    if (!objective || objective.type !== "build") return;
    if (objective.requirements?.building !== buildingId) return;

    this.addProgress(1);
  }

  onEnemyKilled(enemy) {
    const objective = this.getCurrentObjective();

    if (!objective || objective.type !== "kill") return;

    this.addProgress(1);
  }

  onSurviveNight() {
    const objective = this.getCurrentObjective();

    if (!objective || objective.type !== "survive") return;

    this.addProgress(1);
  }
}
