import InputState from "./InputState.js";

export default class InputController {
  constructor(scene) {
    this.scene = scene;
    this.state = new InputState();

    this.cursors = scene.input.keyboard.createCursorKeys();

    this.state.isMobile = this.scene.sys.game.device.input.touch;

    if (this.state.isMobile) {
      this.setupMobile();
    } else {
      this.setupPC();
    }
    // this.setupMobile();
    // this.setupPC();
  }

  setupMobile() {
    // JOYSTICK --------------------------------------------------------------------------------------------------------------------
    this.joystickActive = false;
    this.joyPointerId = null;

    this.joyBase = this.scene.add
      .circle(120, 480, 50, 0x000000, 0.3)
      .setScrollFactor(0)
      .setDepth(9999);

    this.joyThumb = this.scene.add
      .circle(120, 480, 25, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    this.scene.actionButtonUI.button.on("pointerdown", (pointer) => {
      console.log("BUTTON CLICKED");

      this.state.actionPointerId = pointer.id;
      this.state.actionPressed = true;
      this.state.actionHeld = true;
    });

    this.scene.actionButtonUI.button.on("pointerup", () => {
      this.state.actionHeld = false;
      this.state.actionReleased = true;
    });

    // POINTER DOWN ON SCREEN
    this.scene.input.on("pointerdown", (pointer) => {
      // Joystick - only left side starts joystick
      if (
        pointer.x < this.scene.scale.width * 0.4 &&
        this.joyPointerId === null
      ) {
        this.joyPointerId = pointer.id;
        this.joystickActive = true;

        this.joyBase.setPosition(pointer.x, pointer.y);
        this.joyThumb.setPosition(pointer.x, pointer.y);

        this.state.moveVector.set(0, 0);
      }

      if (this.isOverUI(pointer)) return;

      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;
    });

    // POINTER MOVE (movement + aim)
    this.scene.input.on("pointermove", (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;

      if (!this.joystickActive) return;
      if (pointer.id !== this.joyPointerId) return;

      // JOYSTICK
      const dx = pointer.x - this.joyBase.x;
      const dy = pointer.y - this.joyBase.y;

      const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 50);

      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;

      this.joyThumb.setPosition(
        this.joyBase.x + thumbX,
        this.joyBase.y + thumbY,
      );

      // normalized movement vector with dead zone (don't make character move instanly when joystick just move tiny bit)
      const deadzone = 14;

      if (distance < deadzone) {
        this.state.moveVector.set(0, 0);
      } else {
        this.state.moveVector.set(thumbX / 50, thumbY / 50);
      }
    });

    // POINTER UP (joystick release + action release)
    this.scene.input.on("pointerup", (pointer) => {
      // Joystick
      if (pointer.id === this.joyPointerId) {
        this.joystickActive = false;
        this.joyPointerId = null;

        this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);

        this.state.moveVector.set(0, 0);
      }
    });
  }

  setupPC() {
    this.keys = this.scene.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    });

    // restart button
    this.restartKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R,
    );

    // mouse move = aim
    this.scene.input.on("pointermove", (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;
    });

    // click = action
    this.scene.input.on("pointerdown", (pointer) => {
      if (this.isOverUI(pointer)) return;

      console.log("attack - pointerdown pc");
      this.state.actionPressed = true;
      this.state.actionHeld = true;
    });

    // pointer released
    this.scene.input.on("pointerup", (pointer) => {
      this.state.actionHeld = false;
      this.state.actionReleased = true;
    });

    // toggler for Build mode and Combat mode
    this.scene.input.keyboard.on("keydown-B", () => {
      this.state.toggleBuildModePressed = true;
    });

    // mouse wheel scroll for selecting items in combar/build hotbar
    this.scene.input.on("wheel", (_, __, ___, deltaY) => {
      this.state.hotbarScroll = deltaY > 0 ? 1 : -1;
    });
  }

  isOverUI(pointer) {
    const objects = this.scene.input.manager.hitTest(
      pointer,
      this.scene.input._list,
      this.scene.cameras.main,
    );

    return objects.some((obj) => obj.isUI);
  }

  // consumeAction() {
  //   if (this.state.actionPressed) {
  //     this.state.actionPressed = false;
  //     return true;
  //   }

  //   return false;
  // }

  update() {
    if (!this.state.isMobile) {
      this.state.moveVector.set(0, 0);

      // Keyboard Movement (arrow keys)
      if (this.cursors.left.isDown) this.state.moveVector.x = -1;
      if (this.cursors.right.isDown) this.state.moveVector.x = 1;
      if (this.cursors.up.isDown) this.state.moveVector.y = -1;
      if (this.cursors.down.isDown) this.state.moveVector.y = 1;

      // Keyboard Movement (WASD)
      if (this.keys.left.isDown) this.state.moveVector.x = -1;
      if (this.keys.right.isDown) this.state.moveVector.x = 1;
      if (this.keys.up.isDown) this.state.moveVector.y = -1;
      if (this.keys.down.isDown) this.state.moveVector.y = 1;
    }

    // Restart game
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.scene.restart();
    }
  }
}
