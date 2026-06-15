export default class ResourceDrop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, itemId, amount = 1) {
    super(scene, x, y, itemId);

    this.scene = scene;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.itemId = itemId;
    this.amount = amount;

    this.body.setAllowGravity(false);

    this.setDepth(this.body.center.y);
  }

  pickup(player) {
    this.scene.inventorySystem.addItem(this.itemId, "resource", this.amount);

    this.destroy();
  }
}
