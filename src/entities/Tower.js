import { BUILDINGS } from "../data/buildings.js";
import Building from "./Building.js";
import Projectile from "./Projectile.js";

export default class Tower extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, "tower", "tower_1_lv1");

    this.body.setSize(64, 64);
    const offsetX = BUILDINGS["tower"].footprintOffsetX * 32;
    const offsetY = BUILDINGS["tower"].footprintOffsetY * 32;
    this.body.setOffset(offsetX, offsetY); // prettier-ignore
    this.setDepth(this.body.center.y);

    // Add Weapon to the Tower
    this.weapon = this.scene.add.sprite(this.body.center.x, this.body.center.y - 36, "tower", "tower_1_lv1_weapon_0").setDepth(this.depth + 1); // prettier-ignore

    this.range = 200;
    this.damage = 1;
    this.fireRate = 1000;
    this.canShoot = true;

    this.targetMode = "closest";
  }

  static preload(scene) {
    scene.load.atlas("tower", "assets/tower/tower.png", "assets/tower/tower_atlas.json"); // prettier-ignore
    scene.load.animation("tower_anim", "assets/tower/tower_anim.json");
  }

  findTarget() {
    switch (this.targetMode) {
      case "closest":
        return this.findClosestTarget();

      default:
        return this.findClosestTarget();
    }
  }

  findClosestTarget() {
    let closest = null;
    let closestDist = Infinity;

    const enemies = this.scene.combatSystem.getEnemies().getChildren();

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const dist = Phaser.Math.Distance.Between(this.body.center.x, this.body.center.y, enemy.body.center.x, enemy.body.center.y); // prettier-ignore

      if (dist > this.range) continue;

      if (dist < this.range && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }

    return closest;
  }

  findFurthestTarget() {}

  findLowestHP() {}

  rotateWeapon(target) {
    const angle = Phaser.Math.Angle.Between(this.body.center.x, this.body.center.y, target.body.center.x, target.body.center.y); // prettier-ignore

    this.weapon.rotation = angle + Math.PI / 2; // + 90 deg
  }

  shoot(target) {
    this.canShoot = false;

    this.playShootAnimation();

    this.scene.time.delayedCall(500, () => {
      if (!this.active) return;

      this.spawnProjectile(target);
    });

    this.startCooldown();
  }

  playShootAnimation() {
    this.weapon.play("tower_1_lv1_weapon");

    this.weapon.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.weapon.setFrame("tower_1_lv1_weapon_0");
    });
  }

  startCooldown() {
    this.scene.time.delayedCall(this.fireRate, () => {
      if (this.active) {
        this.canShoot = true;
      }
    });
  }

  spawnProjectile(target) {
    const muzzleDistance = 48;

    const angle = this.weapon.rotation - Math.PI / 2;

    const spawnX = this.weapon.x + Math.cos(angle) * muzzleDistance; // prettier-ignore
    const spawnY = this.weapon.y + Math.sin(angle) * muzzleDistance; // prettier-ignore

    const projectile = new Projectile(this.scene, spawnX, spawnY, target, this.damage, angle); // prettier-ignore

    this.scene.projectiles.add(projectile);
  }

  die() {
    this.weapon.destroy();

    super.die();
  }

  update() {
    const target = this.findTarget();

    if (!target) return;

    this.rotateWeapon(target);

    if (this.canShoot) {
      this.shoot(target);
    }
  }
}
