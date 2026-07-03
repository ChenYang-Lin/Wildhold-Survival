import { WAVES } from "../data/waves.js";

export default class WaveManager {
  constructor(scene) {
    this.scene = scene;

    this.spawnPoints = [
      { x: 50, y: 50 },
      { x: 1550, y: 50 },
      { x: 50, y: 1150 },
      { x: 1550, y: 1150 },
    ];
  }

  startWave() {
    const wave = this.getWaveData();

    this.spawnEnemies(wave);
  }

  spawnEnemies(wave) {
    wave.enemies.forEach((enemy) => {
      for (let i = 0; i < enemy.count; i++) {
        const spawn = this.getRandomSpawnPosition();

        this.scene.combatSystem.spawnEnemy(spawn.x, spawn.y, enemy.stats, enemy.type); // prettier-ignore
      }
    });
  }

  getWaveData() {
    return WAVES[Math.min(this.scene.dayNightSystem.day - 1, WAVES.length - 1)];
  }

  getRandomSpawnPosition() {
    const point = Phaser.Utils.Array.GetRandom(this.spawnPoints);

    return {
      x: point.x + Phaser.Math.Between(-80, 80),
      y: point.y + Phaser.Math.Between(-80, 80),
    };
  }
}
