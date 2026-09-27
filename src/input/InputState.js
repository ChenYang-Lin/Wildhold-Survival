export default class InputState {
  constructor() {
    // movement
    this.moveVector = new Phaser.Math.Vector2(0, 0);

    // aiming
    this.aimWorldX = 0;
    this.aimWorldY = 0;

    // attack
    this.attackPointerId = null;
    this.attackPressed = false;
    this.attackHeld = false;
    this.attackReleased = false;

    // platform
    this.isMobile = false;

    // Movement
    this.dashPressed = false;
    this.sprintHeld = false;
    this.movementPointerId = null; // For mobile button
  }
}
