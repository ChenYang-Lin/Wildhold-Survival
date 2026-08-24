import { movementAnimations } from "../data/playerAnimations.js";

export default class AnimationComponent {
  constructor(owner) {
    this.owner = owner;
  }

  update() {
    if (!this.owner.active) return;

    // Attack has highest animation priority
    if (this.owner.combatFSM.state === this.owner.combatFSM.STATE_ATTACK) {
      return;
    }

    const movementState = this.owner.movementFSM.state;
    const facing = this.owner.movement.facing;

    const animationKey = movementAnimations[movementState][facing];

    if (!animationKey) return;

    if (this.owner.anims.currentAnim?.key !== animationKey) {
      this.owner.play(animationKey, true);
    }
  }
}
