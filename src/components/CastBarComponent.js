export default class CastBarComponent {
  constructor(owner) {
    this.owner = owner;

    this.width = 36;
    this.height = 5;

    this.background = owner.scene.add.rectangle(0, 0, this.width, this.height, 0x222222);

    this.fill = owner.scene.add.rectangle(0, 0, this.width, this.height, 0x55ff55);

    this.background.setOrigin(0.5);
    this.fill.setOrigin(0, 0.5);

    this.background.setVisible(false);
    this.fill.setVisible(false);

    this.progress = 0;
    this.isCasting = false;
  }

  show(duration) {
    this.duration = duration;
    this.elapsed = 0;

    this.progress = 0;
    this.isCasting = true;

    this.fill.width = 0;

    this.background.setVisible(true);
    this.fill.setVisible(true);
  }

  hide() {
    this.isCasting = false;

    this.background.setVisible(false);
    this.fill.setVisible(false);
  }

  destroy() {
    this.background.destroy();
    this.fill.destroy();
  }

  update(delta) {
    if (!this.owner.active) return;

    const x = this.owner.body.center.x;
    const y = this.owner.body.top - 10;

    this.background.setPosition(x, y);

    this.fill.setPosition(x - this.width / 2, y);

    if (!this.isCasting) return;

    this.elapsed += delta;

    this.progress = Phaser.Math.Clamp(this.elapsed / this.duration, 0, 1);

    this.fill.width = this.width * this.progress;
  }
}
