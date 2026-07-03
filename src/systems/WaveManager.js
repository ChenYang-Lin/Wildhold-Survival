import { WAVES } from "../data/waves.js";

export default class WaveManager {
  constructor(scene) {
    this.scene = scene;

    this.currentWave = 1;
  }

  getWaveData() {
    return WAVES[this.currentWave - 1];
  }

  startWave() {
    console.log("Wave", this.currentWave, this.getWaveData());
  }

  endWave() {
    this.currentWave++;
  }
}
