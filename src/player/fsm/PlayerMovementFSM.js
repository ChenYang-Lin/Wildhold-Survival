export default class PlayerMovementFSM {
  constructor(owner) {
    this.owner = owner;

    this.STATE_IDLE = "idle";
    this.STATE_WALK = "walk";
    this.STATE_SPRINT = "sprint";
    this.STATE_DASH = "dash";

    this.state = this.STATE_IDLE;

    // Dash
    this.dashDuration = 150;
    this.dashSpeed = 400;

    this.dashTimer = 0;
    this.dashDirection = new Phaser.Math.Vector2(0, 0);
  }

  enterIdle() {
    if (this.state === this.STATE_IDLE) return;

    this.state = this.STATE_IDLE;
  }

  enterWalk() {
    if (this.state === this.STATE_WALK) return;

    this.state = this.STATE_WALK;
  }

  enterSprint() {
    if (this.state === this.STATE_SPRINT) return;

    this.state = this.STATE_SPRINT;
  }

  enterDash(input) {
    if (this.state === this.STATE_DASH) return;

    this.state = this.STATE_DASH;

    this.dashTimer = this.dashDuration;

    const move = input.moveVector.clone();

    if (move.lengthSq() > 0) {
      move.normalize();
      this.dashDirection.copy(move);
    } else {
      switch (this.owner.movement.facing) {
        case "up":
          this.dashDirection.set(0, -1);
          break;

        case "down":
          this.dashDirection.set(0, 1);
          break;

        case "left":
          this.dashDirection.set(-1, 0);
          break;

        case "right":
          this.dashDirection.set(1, 0);
          break;
      }
    }
  }

  updateWalk(input, delta) {
    if (input.moveVector.lengthSq() === 0) {
      this.enterIdle();
      return;
    }

    if (input.sprintHeld && this.owner.stats.stamina > 0) {
      this.enterSprint();
      return;
    }

    this.owner.movement.update(input.moveVector, this.owner.stats.speed);

    this.owner.stats.updateStaminaRegen(delta);
  }

  updateSprint(input, delta) {
    if (input.moveVector.lengthSq() === 0) {
      this.enterIdle();
      this.owner.movement.stop();
      return;
    }

    if (!input.sprintHeld || this.owner.stats.stamina <= 0) {
      this.enterWalk();
      return;
    }

    this.owner.movement.update(input.moveVector, this.owner.stats.speed * 1.5);

    this.owner.stats.consumeStamina(this.owner.stats.staminaDrainRate * (delta / 1000));
  }

  updateIdle(input, delta) {
    if (input.moveVector.lengthSq() === 0) {
      this.owner.movement.stop();
      this.owner.stats.updateStaminaRegen(delta);
      return;
    }

    if (input.sprintHeld && this.owner.stats.stamina > 0) {
      this.enterSprint();
      return;
    }

    this.enterWalk();
  }

  updateDash(input, delta) {
    this.owner.movement.dash(this.dashDirection, this.dashSpeed);

    this.dashTimer -= delta;

    if (this.dashTimer > 0) {
      return;
    }

    this.owner.movement.updateFacing();

    if (input.moveVector.lengthSq() === 0) {
      this.enterIdle();
      this.owner.movement.stop();
      return;
    }

    if (input.sprintHeld) {
      this.enterSprint();
      this.owner.movement.update(input.moveVector, this.owner.stats.speed * 1.5);
      return;
    }

    this.enterWalk();
    this.owner.movement.update(input.moveVector, this.owner.stats.speed);
  }

  update(input, delta) {
    switch (this.state) {
      case this.STATE_IDLE:
        this.updateIdle(input, delta);
        break;

      case this.STATE_WALK:
        this.updateWalk(input, delta);
        break;

      case this.STATE_SPRINT:
        this.updateSprint(input, delta);
        break;

      case this.STATE_DASH:
        this.updateDash(input, delta);
        break;
    }
  }
}
