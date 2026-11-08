import InputState from "./InputState.js";
import AttackButtonUI from "./../ui/AttackButtonUI.js";
import MovementButtonUI from "../ui/MovementButtonUI.js";

export default class InputController {
  constructor(scene) {
    this.scene = scene;
    this.state = new InputState();

    this.placementPointerId = null;
    this.destroyed = false;

    this.cursors = scene.input.keyboard.createCursorKeys();

    this.state.isMobile = scene.sys.game.device.input.touch;

    if (this.state.isMobile) {
      this.setupMobile();
    } else {
      this.setupPC();
    }

    // Clean up this controller when the scene shuts down or restarts.
    this.onShutdown = () => this.destroy();

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown);
  }

  setupMobile() {
    this.attackButtonUI = new AttackButtonUI(this.scene);
    this.movementButtonUI = new MovementButtonUI(this.scene);

    // Joystick
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

    // Attack button
    this.onAttackButtonDown = (pointer) => {
      if (!this.isActionAllowed("combat.attack")) return;

      this.state.attackPointerId = pointer.id;
      this.state.attackPressed = true;
      this.state.attackHeld = true;
    };

    this.onAttackButtonUp = (pointer) => {
      if (pointer.id !== this.state.attackPointerId) return;

      this.state.attackHeld = false;
      this.state.attackReleased = true;
      this.state.attackPointerId = null;
    };

    this.attackButtonUI.button.on("pointerdown", this.onAttackButtonDown);

    this.attackButtonUI.button.on("pointerup", this.onAttackButtonUp);

    // Dash / sprint button
    this.onMovementButtonDown = (pointer) => {
      if (!this.isActionAllowed("player.dash")) return;

      this.state.movementPointerId = pointer.id;
      this.state.dashPressed = true;
      this.state.sprintHeld = true;
    };

    this.onMovementButtonUp = (pointer) => {
      if (pointer.id !== this.state.movementPointerId) return;

      this.state.sprintHeld = false;
      this.state.movementPointerId = null;
    };

    this.movementButtonUI.button.on("pointerdown", this.onMovementButtonDown);

    this.movementButtonUI.button.on("pointerup", this.onMovementButtonUp);

    // Screen pointer down
    this.onPointerDown = (pointer) => {
      if (this.isOverBuildingInfoCard(pointer)) {
        this.scene.buildingInteractionSystem.handlePointerDown(pointer);
        return;
      }

      if (this.isOverUI(pointer)) {
        this.scene.buildingInteractionSystem?.close();
        return;
      }

      if (this.scene.placementSystem?.isPlacing || this.scene.placementSystem?.isMoving) {
        this.placementPointerId = pointer.id;

        this.state.aimWorldX = pointer.worldX;
        this.state.aimWorldY = pointer.worldY;

        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      if (this.scene.buildingInteractionSystem?.handlePointerDown(pointer)) {
        return;
      }

      // Joystick activation
      if (pointer.x < this.scene.scale.width * 0.4 && this.joyPointerId === null && this.isActionAllowed("player.move")) {
        this.joyPointerId = pointer.id;
        this.joystickActive = true;

        this.state.moveVector.set(0, 0);
      }

      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;
    };

    // Screen pointer move
    this.onPointerMove = (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;

      if ((this.scene.placementSystem?.isPlacing || this.scene.placementSystem?.isMoving) && pointer.id === this.placementPointerId) {
        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      if (!this.joystickActive) return;
      if (pointer.id !== this.joyPointerId) return;

      const dx = pointer.x - this.joyBase.x;
      const dy = pointer.y - this.joyBase.y;

      const distance = Math.min(Phaser.Math.Distance.Between(this.joyBase.x, this.joyBase.y, pointer.x, pointer.y), 50);

      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * distance;
      const thumbY = Math.sin(angle) * distance;

      this.joyThumb.setPosition(this.joyBase.x + thumbX, this.joyBase.y + thumbY);

      const deadzone = 14;

      if (distance < deadzone) {
        this.state.moveVector.set(0, 0);
      } else {
        this.state.moveVector.set(thumbX / 50, thumbY / 50);
      }
    };

    // Screen pointer up
    this.onPointerUp = (pointer) => {
      if (pointer.id === this.placementPointerId) {
        this.scene.placementSystem?.notifyTutorialOfValidPosition();
        this.placementPointerId = null;
      }

      if (pointer.id === this.joyPointerId) {
        this.joystickActive = false;
        this.joyPointerId = null;

        this.joyThumb.setPosition(this.joyBase.x, this.joyBase.y);

        this.state.moveVector.set(0, 0);
      }
    };

    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointermove", this.onPointerMove);
    this.scene.input.on("pointerup", this.onPointerUp);

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

    this.restartKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Mouse move
    this.onPointerMove = (pointer) => {
      this.state.aimWorldX = pointer.worldX;
      this.state.aimWorldY = pointer.worldY;

      if ((this.scene.placementSystem?.isPlacing || this.scene.placementSystem?.isMoving) && pointer.id === this.placementPointerId) {
        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);
      }
    };

    // Mouse click
    this.onPointerDown = (pointer) => {
      if (this.isOverBuildingInfoCard(pointer)) {
        this.scene.buildingInteractionSystem.handlePointerDown(pointer);
        return;
      }

      if (this.isOverUI(pointer)) {
        this.scene.buildingInteractionSystem?.close();
        return;
      }

      if (this.scene.placementSystem?.isPlacing || this.scene.placementSystem?.isMoving) {
        this.placementPointerId = pointer.id;

        this.state.aimWorldX = pointer.worldX;
        this.state.aimWorldY = pointer.worldY;

        this.scene.placementSystem.moveToWorldPosition(pointer.worldX, pointer.worldY);

        return;
      }

      if (this.scene.buildingInteractionSystem?.handlePointerDown(pointer)) {
        return;
      }

      if (pointer.button === 0 && this.isActionAllowed("combat.attack")) {
        this.state.attackPressed = true;
        this.state.attackHeld = true;
      }

      if (pointer.button === 2 && this.isActionAllowed("player.dash")) {
        this.state.dashPressed = true;
        this.state.sprintHeld = true;
      }
    };

    // Mouse release
    this.onPointerUp = (pointer) => {
      if (pointer.id === this.placementPointerId) {
        this.scene.placementSystem?.notifyTutorialOfValidPosition();
        this.placementPointerId = null;
      }

      if (pointer.button === 0) {
        this.state.attackHeld = false;
        this.state.attackReleased = true;
      }

      if (pointer.button === 2) {
        this.state.sprintHeld = false;
      }
    };

    this.scene.input.on("pointermove", this.onPointerMove);
    this.scene.input.on("pointerdown", this.onPointerDown);
    this.scene.input.on("pointerup", this.onPointerUp);
  }

  isOverUI(pointer) {
    const objects = this.scene.input.manager.hitTest(pointer, this.scene.input._list, this.scene.cameras.main);

    return objects.some((obj) => obj.isUI);
  }

  isActionAllowed(actionId) {
    return this.scene.tutorialSystem?.isActionAllowed(actionId) ?? true;
  }

  isOverBuildingInfoCard(pointer) {
    const card = this.scene.buildingInteractionSystem?.card;

    return card?.containsScreenPoint(pointer.x, pointer.y) ?? false;
  }

  resetUIPosition() {
    const w = this.scene.scale.width;
    const h = Math.min(this.scene.scale.height, window.innerHeight);

    // Joystick
    this.joyBase?.setPosition(120, h - 100);
    this.joyThumb?.setPosition(120, h - 100);

    // Attack button
    if (this.attackButtonUI) {
      this.attackButtonUI.button.setPosition(w - 150, h - 110);

      this.attackButtonUI.text.setPosition(w - 150, h - 110);

      this.attackButtonUI.highlightRing?.setPosition(w - 150, h - 110);
    }

    // Dash button
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

      if (this.isActionAllowed("player.move")) {
        // Cursor keys
        if (this.cursors.left.isDown) {
          this.state.moveVector.x = -1;
        }

        if (this.cursors.right.isDown) {
          this.state.moveVector.x = 1;
        }

        if (this.cursors.up.isDown) {
          this.state.moveVector.y = -1;
        }

        if (this.cursors.down.isDown) {
          this.state.moveVector.y = 1;
        }

        // WASD
        if (this.keys.left.isDown) {
          this.state.moveVector.x = -1;
        }

        if (this.keys.right.isDown) {
          this.state.moveVector.x = 1;
        }

        if (this.keys.up.isDown) {
          this.state.moveVector.y = -1;
        }

        if (this.keys.down.isDown) {
          this.state.moveVector.y = 1;
        }
      }
    }

    // Restart
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.scene.restart();
    }
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    // Remove scene input listeners
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerup", this.onPointerUp);

    // Remove button listeners
    if (this.attackButtonUI?.button) {
      this.attackButtonUI.button.off("pointerdown", this.onAttackButtonDown);

      this.attackButtonUI.button.off("pointerup", this.onAttackButtonUp);
    }

    if (this.movementButtonUI?.button) {
      this.movementButtonUI.button.off("pointerdown", this.onMovementButtonDown);

      this.movementButtonUI.button.off("pointerup", this.onMovementButtonUp);
    }

    // Destroy joystick objects
    this.joyBase?.destroy();
    this.joyThumb?.destroy();

    // Reset input state
    this.joystickActive = false;
    this.joyPointerId = null;
    this.placementPointerId = null;
  }
}
