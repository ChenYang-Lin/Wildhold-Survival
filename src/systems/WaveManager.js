import { WAVES } from "../data/waves.js";

export default class WaveManager {
  constructor(scene) {
    this.scene = scene;
  }

  startWave() {
    const wave = this.getWaveData();

    this.spawnEnemies(wave);
  }

  getWaveData() {
    return WAVES[Math.min(this.scene.dayNightSystem.day - 1, WAVES.length - 1)];
  }

  spawnEnemies(wave) {
    wave.camps.forEach((campData) => {
      const camp = this.scene.mapManager.getEnemyCamp(campData.campId);

      if (!camp) return;

      this.spawnCamp(camp, campData);
    });
  }

  spawnCamp(camp, campData) {
    campData.enemies.forEach((enemyData) => {
      for (let i = 0; i < enemyData.count; i++) {
        const spawn = this.getRandomSpawnPosition(camp);

        this.scene.combatSystem.spawnEnemy(spawn.x, spawn.y, enemyData.stats, enemyData.type);
      }
    });
  }

  getRandomSpawnPosition(camp) {
    return {
      x: camp.x + Phaser.Math.Between(-80, 80),
      y: camp.y + Phaser.Math.Between(-80, 80),
    };
  }
}
