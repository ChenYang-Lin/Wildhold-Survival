export default class BaseAura {
  constructor(scene, owner) {
    this.scene = scene;
    this.owner = owner;

    this.container = scene.add.container();

    this.container.setDepth(owner.depth + 2);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);

    this.container.destroy();
  }

  update(time, delta) {
    if (!this.owner.active) return;

    this.container.setPosition(this.owner.body.center.x, this.owner.body.center.y - 4);

    this.container.setDepth(this.owner.depth + 2);
  }
}
