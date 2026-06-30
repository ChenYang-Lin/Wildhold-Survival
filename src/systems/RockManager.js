import Rock from "../entities/Rock.js";

export default class RockManager {
  constructor(scene) {
    this.scene = scene;

    this.respawnQueue = [];
  }

  onRockDestroyed(rock) {
    const ROCK_RESPAWN_DAYS = 2;

    this.respawnQueue = this.respawnQueue.filter((record) => {
      return !(record.x === rock.x && record.y === rock.y);
    });

    this.respawnQueue.push({
      x: rock.x,
      y: rock.y,
      daysRemaining: ROCK_RESPAWN_DAYS,
    });
  }

  advanceRespawn() {
    for (const record of this.respawnQueue) {
      record.daysRemaining--;
      if (record.daysRemaining > 0) continue;

      const rock = new Rock(this.scene, record.x, record.y);

      this.scene.rocks.add(rock);

      record.finished = true;
    }

    this.respawnQueue = this.respawnQueue.filter((record) => !record.finished);
  }
}
