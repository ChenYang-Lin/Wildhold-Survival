export default class MovementComponent {
  constructor(owner) {
    this.owner = owner;

    this.facing = "down";

    this.speed = 100;
  }

  updateFacing() {
    const vx = this.owner.body.velocity.x;
    const vy = this.owner.body.velocity.y;

    if (vx === 0 && vy === 0) return;

    if (Math.abs(vx) > Math.abs(vy)) {
      this.facing = vx > 0 ? "right" : "left";
    } else {
      this.facing = vy > 0 ? "down" : "up";
    }
  }

  stopMovement() {
    this.owner.body.stop();
  }

  move(moveVector) {
    const move = moveVector.clone();

    if (move.length() > 1) {
      move.normalize();
    }

    this.owner.setVelocity(move.x * this.speed, move.y * this.speed);
    this.updateFacing();
  }
}
