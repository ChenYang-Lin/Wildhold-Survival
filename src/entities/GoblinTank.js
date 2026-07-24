import Enemy from "./Enemy.js";

export default class GoblinTank extends Enemy {
  constructor(scene, x, y, stats = {}, campNode) {
    const goblinStats = {
      attackRange: stats.attackRange ?? 32,
      attackDamage: stats.damage ?? 1,
      attackCooldown: stats.attackCooldown ?? 1000,

      windupDuration: stats.windupDuration ?? 500,
      attackDelay: stats.attackDelay ?? 150,
      attackRecoverDuration: stats.attackRecoverDuration ?? 800,
      hitboxLifetime: stats.hitboxLifetime ?? 80,

      maxHP: 10,
    };

    super(scene, x, y, "goblin_tank", "goblin_tank_idle_down", goblinStats, campNode);

    this.type = "goblin_tank";

    this.setScale(1.5);
    this.setOrigin(0.5, 0.5);
    this.body.setSize(20, 16, true);
    this.body.setOffset(86, 112); // 192 x 192, 32 + 32 + 16 + 6, 32 + 32 + 32 + 16
  }

  static preload(scene) {
    scene.load.atlas("goblin_tank", "assets/enemy/goblin_tank.png", "assets/enemy/goblin_tank_atlas.json");
    scene.load.animation("goblin_tank_anim", "assets/enemy/goblin_tank_anim.json");
  }

  attack(damage) {
    super.attack(damage);

    this.spawnAttackHitbox(damage);
  }

  spawnAttackHitbox(damage) {
    let hitX = this.body.center.x;
    let hitY = this.body.center.y;

    let attackWidth = 48;
    let attackHeight = 48;

    switch (this.facing) {
      case "up":
        hitY -= 24;
        break;
      case "down":
        hitY += 24;
        break;
      case "left":
        hitX -= 24;
        break;
      case "right":
        hitX += 24;
        break;
    }

    const hitbox = this.scene.add.zone(hitX, hitY, attackWidth, attackHeight);

    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    const hitTargets = new Set();

    // Player
    this.scene.physics.add.overlap(hitbox, this.scene.player, (_, player) => {
      if (hitTargets.has(player)) return;

      hitTargets.add(player);
      player.takeDamage(damage, this);
    });

    // Buildings
    this.scene.physics.add.overlap(hitbox, this.scene.buildingManager.buildings, (_, building) => {
      if (hitTargets.has(building)) return;

      hitTargets.add(building);
      building.takeDamage(damage, this);
    });

    // Campfire
    this.scene.physics.add.overlap(hitbox, this.scene.campfire, (_, campfire) => {
      if (hitTargets.has(campfire)) return;

      hitTargets.add(campfire);
      campfire.takeDamage(damage, this);
    });

    // Destroy hitbox
    this.scene.time.delayedCall(this.hitboxLifetime, () => {
      hitbox.destroy();
    });
  }

  update(time) {
    super.update(time);
  }
}
