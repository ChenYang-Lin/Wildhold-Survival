export default class PlayerCombatFSM {
  constructor(owner) {
    this.owner = owner;

    this.STATE_IDLE = "idle";
    this.STATE_ATTACK = "attack";

    this.state = this.STATE_IDLE;
  }

  locksMovement() {
    return this.state === this.STATE_ATTACK;
  }

  cancelAttack() {
    if (this.state !== this.STATE_ATTACK) return;

    this.owner.attack.cancelAttack();

    this.enterIdle();
  }

  enterIdle() {
    if (this.state === this.STATE_IDLE) return;

    this.state = this.STATE_IDLE;
  }

  enterAttack(input) {
    if (this.state === this.STATE_ATTACK) return;

    let started;

    const isSprintAttack = this.owner.movementFSM.sprintAttackWindow && input.moveVector.lengthSq() > 0;

    if (isSprintAttack) {
      started = this.owner.attack.startSprintAttack();
      this.owner.movementFSM.resetSprintAttackWindow();
    } else {
      started = this.owner.attack.startBasicMelee();
    }

    if (!started) {
      return;
    }

    this.state = this.STATE_ATTACK;
  }

  updateIdle(input) {
    if (!input.actionPressed) {
      return;
    }

    this.enterAttack(input);
  }

  updateAttack(input, delta) {
    this.owner.attack.update(input, delta);

    if (!this.owner.attack.isAttacking()) {
      this.enterIdle();
    }
  }

  update(input, delta) {
    switch (this.state) {
      case this.STATE_IDLE:
        this.updateIdle(input, delta);
        break;

      case this.STATE_ATTACK:
        this.updateAttack(input, delta);
        break;
    }
  }
}
