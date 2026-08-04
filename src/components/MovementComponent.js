export default class MovementComponent {
  constructor(owner) {
    this.owner = owner;

    this.facing = "down";

    this.isSprinting = false;
    this.isDashing = false;
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

  stop() {
    this.owner.body.stop();
  }

  update(moveVector, delta) {
    const move = moveVector.clone();

    if (move.length() > 1) {
      move.normalize();
    }

    const speed = this.owner.stats.speed;
    this.owner.setVelocity(move.x * speed, move.y * speed);

    this.updateFacing();
  }
}
