import CastBarComponent from "../components/CastBarComponent.js";
import Enemy from "./Enemy.js";

export default class GoblinShaman extends Enemy {
  constructor(scene, x, y, stats = {}, campNode) {
    const goblinStats = {
      attackRange: stats.attackRange ?? 20,
      attackDamage: stats.damage ?? 1,
      attackCooldown: stats.attackCooldown ?? 1000,

      windupDuration: stats.windupDuration ?? 500,
      attackDelay: stats.attackDelay ?? 150,
      attackRecoverDuration: stats.attackRecoverDuration ?? 800,
      hitboxLifetime: stats.hitboxLifetime ?? 80,
    };

    super(scene, x, y, "goblin_shaman", "goblin_shaman_idle_down", goblinStats, campNode);

    this.type = "goblin_shaman";

    this.setOrigin(0.5, 0.5);
    this.body.setSize(20, 16);
    this.body.setOffset(86, 112); // 192 x 192, 32 + 32 + 16 + 6, 32 + 32 + 16 + 16 + 32

    this.castBar = new CastBarComponent(this);

    this.spellRange = stats.spellRange ?? 120;
    this.spellCooldown = stats.spellCooldown ?? 5000;
    this.castingTime = 2000;
    this.isCastingSpell = false;

    this.spellCastEvent = this.scene.time.addEvent({
      delay: this.spellCooldown,
      loop: true,
      callback: () => {
        if (!this.active) return;
        if (this.isActionLocked()) return;

        this.tryCastBuff();
      },
    });
  }

  static preload(scene) {
    scene.load.atlas("goblin_shaman", "assets/enemy/goblin_shaman.png", "assets/enemy/goblin_shaman_atlas.json");
    scene.load.animation("goblin_shaman_anim", "assets/enemy/goblin_shaman_anim.json");
  }

  attack() {
    super.attack();

    const damage = this.stats.damage;

    this.spawnAttackHitbox(damage);
  }

  spawnAttackHitbox(damage) {
    let hitX = this.body.center.x;
    let hitY = this.body.center.y;

    let hitWidth = 32;
    let hitHeight = 32;

    switch (this.facing) {
      case "up":
        hitY -= 24;
        hitWidth = 32;
        break;
      case "down":
        hitY += 24;
        hitWidth = 32;
        break;
      case "left":
        hitX -= 24;
        hitHeight = 32;
        break;
      case "right":
        hitX += 24;
        hitHeight = 32;
        break;
    }

    const hitbox = this.scene.add.zone(hitX, hitY, hitWidth, hitHeight);

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

  findAlliesInRange() {
    const allies = [];

    this.scene.combatSystem.enemies.children.iterate((enemy) => {
      if (!enemy || enemy === this || !enemy.active) return;

      if (this.distanceTo(enemy) <= this.spellRange) {
        allies.push(enemy);
      }
    });

    return allies;
  }

  tryCastBuff() {
    const allies = this.findAlliesInRange();

    if (allies.length === 0) return false;

    this.castBuff(allies);

    return true;
  }

  castBuff(allies) {
    this.isCastingSpell = true;

    this.stopMoving();

    this.anims.play(`${this.type}_spellcast_${this.facing}`);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + `${this.type}_spellcast_${this.facing}`, () => {
      this.anims.pause();

      this.castBar.show(this.castingTime);

      this.scene.time.delayedCall(this.castingTime, () => {
        if (!this.active) return;

        const spell = this.createRandomSpell();

        switch (spell) {
          case "speed":
            this.scene.spellEffectSystem.showSpeedCast(this);
            break;
          case "damage":
            this.scene.spellEffectSystem.showDamageCast(this);
            break;
          case "heal":
            this.scene.spellEffectSystem.showHealCast(this);
            break;
        }

        for (const ally of allies) {
          if (!ally.active) continue;

          switch (spell) {
            case "speed":
              ally.stats.applyBuff(this.scene.buffFactory.createSpeedBuff());
              break;

            case "damage":
              ally.stats.applyBuff(this.scene.buffFactory.createDamageBuff());
              break;

            case "heal":
              ally.health.heal(1);
              this.scene.spellEffectSystem.showHeal(ally);
              break;
          }
        }

        this.castBar.hide();

        this.anims.resume();
        this.anims.play(`${this.type}_idle_${this.facing}`);

        this.isCastingSpell = false;
      });
    });
  }

  createRandomSpell() {
    return Phaser.Utils.Array.GetRandom(["speed", "damage", "heal"]);
  }

  isActionLocked() {
    return this.isCastingSpell || this.aiState === this.STATE_WINDUP || this.aiState === this.STATE_ATTACK;
  }

  die() {
    this.spellCastEvent.remove();
    super.die();
  }

  update(time, delta) {
    super.update(time);

    console.log({
      state: this.aiState,
      casting: this.isCastingSpell,
      canAttack: this.combat.canAttack,
      velocity: this.body.velocity,
      currentAnim: this.anims.currentAnim?.key,
      isPaused: this.anims.paused,
    });
  }
}
