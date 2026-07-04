import { GAME_STATE } from "../data/GameState.js";

export default class DayNightSystem {
  constructor(scene) {
    this.scene = scene;

    this.day = 1;

    this.isNight = false;

    // this.dayDuration = 20000;
    this.dayDuration = 10000;
    this.nightDuration = 30000;

    this.timer = this.dayDuration;
    const count = 3 + this.day;

    this.dayText = scene.add.text(250, 20, "", { fontSize: "18px", color: "#ffffff" }).setScrollFactor(0).setDepth(10000); // prettier-ignore

    this.spawnPoints = [
      { x: 50, y: 50 },
      { x: 1550, y: 50 },
      { x: 50, y: 1150 },
      { x: 1550, y: 1150 },
    ];
  }

  startNight() {
    this.isNight = true;
    this.timer = this.nightDuration;

    this.scene.tweens.add({
      targets: this.scene.lightingSystem,
      darknessAlpha: 0.95,
      visionRadius: 200,
      glowAlpha: 0.3,
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    this.scene.gameStateManager.setState(GAME_STATE.PAUSED);

    const wave = this.scene.waveManager.getWaveData();
    this.scene.overlayMessageUI.show(
      `Night ${this.day}`,
      "Protect your tent.\nSurvive the night.",
    );

    this.scene.time.delayedCall(2500, () => {
      this.scene.overlayMessageUI.hide();
      this.scene.gameStateManager.setState(GAME_STATE.RUNNING);
      this.scene.waveManager.startWave();
    });

    this.scene.resourceManager.advanceDay();
    console.log("Night started");
  }

  startDay() {
    this.isNight = false;
    this.day++;
    this.timer = this.dayDuration;

    this.scene.tweens.add({
      targets: this.scene.lightingSystem,
      darknessAlpha: 0,
      visionRadius: 1000,
      glowAlpha: 0,
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    this.retreatEnemies();

    this.scene.objectiveSystem.onSurviveNight();

    console.log("Day started");
  }

  retreatEnemies() {
    const enemies = this.scene.combatSystem.getEnemies().getChildren();

    enemies.forEach((enemy) => {
      enemy.enterRetreat();
    });
  }

  update(delta) {
    this.timer -= delta;
    const seconds = Math.floor(this.timer / 1000);

    this.dayText.setText(
      `${this.isNight ? "Night" : "Day"} ${this.day}\nEnds in ${seconds}s`,
    );
    if (this.timer <= 0) {
      this.isNight ? this.startDay() : this.startNight();
    }
  }
}
