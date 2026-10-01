import InputState from "./InputState.js";
import AttackButtonUI from "./../ui/AttackButtonUI.js";
import MovementButtonUI from "../ui/MovementButtonUI.js";

export default class InputController {
  constructor(scene) {
    this.scene = scene;
    this.state = new InputState();

    this.placementPointerId = null;

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
    this.attackButtonUI = new AttackButtonUI(this.scene);
    this.movementButtonUI = new MovementButtonUI(this.scene);

    // JOYSTICK --------------------------------------------------------------------------------------------------------------------
    this.joystickActive = false;
    this.joyPointerId = null;

    const h = this.scene.scale.height;

    this.joyBase = this.scene.add
      .circle(120, h - 120, 50, 0x000000, 0.3)
      .setScrollFactor(0)
      .setDepth(9999);

    this.joyThumb = this.scene.add
      .circle(120, h - 120, 25, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(10000);

    // Attack Button
    this.attackButtonUI.button.on("pointerdown", (pointer) => {
      this.state.attackPointerId = pointer.id;
      this.state.attackPressed = true;
      this.state.attackHeld = true;
    });

    this.attackButtonUI.button.on("pointerup", (pointer) => {
      if (pointer.id !== this.state.attackPointerId) return;

      this.state.attackHeld = false;
      this.state.attackReleased = true;
      this.state.attackPointerId = null;
    });

    // Dash/Sprint button
    this.movementButtonUI.button.on("pointerdown", (pointer) => {
      this.state.movementPointerId = pointer.id;

      this.state.dashPressed = true;
      this.state.sprintHeld = true;
    });

    this.movementButtonUI.button.on("pointerup", (pointer) => {
      if (pointer.id !== this.state.movementPointerId) return;

      this.state.sprintHeld = false;
      this.state.movementPointerId = null;
    });

    // POINTER DOWN ON SCREEN
    this.scene.input.on("pointerdown", (pointer) => {
      if (this.isOverUI(pointer)) return;

      if (this.scene.placementSystem?.isPlacing) {
        this.placementPointerId = pointer.id;

        this.state.aimWorldX = pointer.worldX;
        this.state.aimWorldY = pointer.worldY;

        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      // Joystick
      if (pointer.x < this.scene.scale.width * 0.4 && this.joyPointerId === null) {
        this.joyPointerId = pointer.id;
        this.joystickActive = true;

        this.state.moveVector.set(0, 0);
      }

      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;
    });

    // POINTER MOVE (movement + aim)
    this.scene.input.on("pointermove", (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;

      if (this.scene.placementSystem?.isPlacing && pointer.id === this.placementPointerId) {
        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      if (!this.joystickActive) return;
      if (pointer.id !== this.joyPointerId) return;

      // JOYSTICK
      const dx = pointer.x - this.joyBase.x;
      const dy = pointer.y - this.joyBase.y;

      const distance = Math.min(Phaser.Math.Distance.Between(this.joyBase.x, this.joyBase.y, pointer.x, pointer.y), 50);

      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;

      this.joyThumb.setPosition(this.joyBase.x + thumbX, this.joyBase.y + thumbY);

      // normalized movement vector with dead zone (don't make character move instanly when joystick just move tiny bit)
      const deadzone = 14;

      if (distance < deadzone) {
        this.state.moveVector.set(0, 0);
      } else {
        this.state.moveVector.set(thumbX / 50, thumbY / 50);
      }
    });

    // POINTER UP (joystick release)
    this.scene.input.on("pointerup", (pointer) => {
      if (pointer.id === this.placementPointerId) {
        this.placementPointerId = null;
      }

      // Joystick
      if (pointer.id === this.joyPointerId) {
        this.joystickActive = false;
        this.joyPointerId = null;

        this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);

        this.state.moveVector.set(0, 0);
      }
    });

    // Screen resize
    this.scene.scale.on("resize", () => {
      this.resetUIPosition();
    });

    // make sure every ui is at correct position
    this.resetUIPosition();
  }

  setupPC() {
    this.scene.input.mouse.disableContextMenu();

    this.keys = this.scene.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    });

    // restart button
    this.restartKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // mouse move
    this.scene.input.on("pointermove", (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;

      if (this.scene.placementSystem?.isPlacing && pointer.id === this.placementPointerId) {
        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }
    });

    // click = placement movement, attack, or dash
    this.scene.input.on("pointerdown", (pointer) => {
      if (this.isOverUI(pointer)) return;

      if (this.scene.placementSystem?.isPlacing) {
        this.placementPointerId = pointer.id;

        this.state.aimWorldX = pointer.worldX;
        this.state.aimWorldY = pointer.worldY;

        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      if (pointer.button === 0) {
        // Left click = attack
        this.state.attackPressed = true;
        this.state.attackHeld = true;
      }

      if (pointer.button === 2) {
        // Right click = dash + sprint
        this.state.dashPressed = true;
        this.state.sprintHeld = true;
      }
    });

    // pointer released
    this.scene.input.on("pointerup", (pointer) => {
      if (pointer.id === this.placementPointerId) {
        this.placementPointerId = null;
      }

      if (pointer.button === 0) {
        this.state.attackHeld = false;
        this.state.attackReleased = true;
      }

      if (pointer.button === 2) {
        this.state.sprintHeld = false;
      }
    });
  }

  isOverUI(pointer) {
    const objects = this.scene.input.manager.hitTest(pointer, this.scene.input._list, this.scene.cameras.main);

    return objects.some((obj) => obj.isUI);
  }

  resetUIPosition() {
    const w = this.scene.scale.width;
    const h = Math.min(this.scene.scale.height, window.innerHeight);

    // Joystick
    this.joyBase?.setPosition(120, h - 100);
    this.joyThumb?.setPosition(120, h - 100);

    // Hotbar
    this.scene.hotbarUI?.resetUIPosition();

    // Player health
    this.scene.healthUI?.resetUIPosition();

    // Mini-map
    this.scene.miniMapUI?.resetUIPosition();

    // Attack button - mobile only
    if (this.attackButtonUI) {
      this.attackButtonUI.button.setPosition(w - 150, h - 110);
      this.attackButtonUI.text.setPosition(w - 150, h - 110);
    }

    // Dash button - mobile only
    if (this.movementButtonUI) {
      this.movementButtonUI.button.setPosition(w - 75, h - 45);
      this.movementButtonUI.text.setPosition(w - 75, h - 45);
    }
  }

  endFrame() {
    this.state.dashPressed = false;

    this.state.attackPressed = false;
    this.state.attackReleased = false;
  }

  update() {
    if (!this.state.isMobile) {
      this.state.moveVector.set(0, 0);

      // Keyboard Movement
      if (this.cursors.left.isDown) this.state.moveVector.x = -1;
      if (this.cursors.right.isDown) this.state.moveVector.x = 1;
      if (this.cursors.up.isDown) this.state.moveVector.y = -1;
      if (this.cursors.down.isDown) this.state.moveVector.y = 1;

      // WASD
      if (this.keys.left.isDown) this.state.moveVector.x = -1;
      if (this.keys.right.isDown) this.state.moveVector.x = 1;
      if (this.keys.up.isDown) this.state.moveVector.y = -1;
      if (this.keys.down.isDown) this.state.moveVector.y = 1;
    }

    // Restart
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.scene.restart();
    }
  }
}
