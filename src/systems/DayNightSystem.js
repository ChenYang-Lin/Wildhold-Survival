export default class DayNightSystem {
  constructor(scene) {
    this.scene = scene;

    this.day = 1;

    this.isNight = false;

    this.dayDuration = 10000;
    this.nightDuration = 20000;

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
      visionRadius: 550,
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    this.spawnNightEnemies();
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
      duration: 1000,
      ease: "Sine.easeInOut",
    });

    this.retreatEnemies();
    console.log("Day started");
  }

  spawnNightEnemies() {
    const count = 3 + this.day;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(0, 1600);
      const y = Phaser.Math.Between(0, 1200);
      this.scene.combatSystem.spawnEnemy(x, y);
      // const point = Phaser.Utils.Array.GetRandom(this.spawnPoints);
      // this.scene.combatSystem.spawnEnemy(point.x, point.y);
    }
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
