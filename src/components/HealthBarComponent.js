export default class HealthBarComponent {
  constructor(owner) {
    this.owner = owner;
    this.scene = owner.scene;

    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(this.owner.depth);

    this.width = 32;
    this.height = 4;
    this.offsetY = -40;
  }

  update() {
    if (!this.owner.active) return;

    const health = this.owner.health;
    const percent = health.percent;

    const x = this.owner.body.center.x - this.width / 2;
    const y = this.owner.body.center.y + this.offsetY;

    this.graphics.clear();

    this.graphics.fillStyle(0x222222);
    this.graphics.fillRect(x, y, this.width, this.height);

    this.graphics.fillStyle(0xff0000);
    this.graphics.fillRect(x, y, this.width * percent, this.height);

    this.graphics.setDepth(this.owner.depth);
  }

  destroy() {
    this.graphics.destroy();
  }
}
