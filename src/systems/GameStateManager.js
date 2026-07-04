import { GAME_STATE } from "../data/GameState.js";

export default class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    this.state = GAME_STATE.RUNNING;
  }

  pause() {
    this.state = GAME_STATE.PAUSED;
  }

  resume() {
    this.state = GAME_STATE.RUNNING;
  }

  gameOver() {
    this.state = GAME_STATE.GAME_OVER;
  }

  isGameOver() {
    return this.state === GAME_STATE.GAME_OVER;
  }

  isPaused() {
    return this.state === GAME_STATE.PAUSED;
  }
}
