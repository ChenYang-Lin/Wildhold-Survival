export default class InputState {
  constructor() {
    // movement
    this.moveVector = new Phaser.Math.Vector2(0, 0);

    // aiming
    this.aimWorldX = 0;
    this.aimWorldY = 0;

    // actions
    this.actionPointerId = null;
    this.actionHeld = false;
    this.actionPressed = false;
    this.actionReleased = false;

    // hotbar
    this.selectedSlot = 0;

    // platform
    this.isMobile = false;

    // Combat - Build (hotbar)
    this.toggleBuildModePressed = false;
    this.hotbarScroll = 0;
  }
}
