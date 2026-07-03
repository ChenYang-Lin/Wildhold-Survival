import { GAME_STATE } from "../data/GameState.js";

export default class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    this.state = GAME_STATE.RUNNING;
  }

  setState(state) {
    this.state = state;
  }

  isGameOver() {
    return this.state === GAME_STATE.GAME_OVER;
  }

  isPaused() {
    return this.state !== GAME_STATE.RUNNING;
  }
}
