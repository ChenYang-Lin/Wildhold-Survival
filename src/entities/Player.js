import HealthComponent from "../components/HealthComponent.js";
import MovementComponent from "../components/MovementComponent.js";
import StatsComponent from "../components/StatsComponent.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "survivor", "survivor_idle_down");
    this.scene = scene;
    // this.input = input;

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.body.setSize(20, 16);
    this.body.setOffset(86, 112); // 192 x 192, 32 + 32 + 16 + 6, 32 + 32 + 16 + 16 + 32

    this.health = new HealthComponent(this, 10);
    this.movement = new MovementComponent(this);
    this.stats = new StatsComponent(this, {
      speed: 100,
      damage: 1,
      attackCooldown: 500,
      stamina: 100,
      maxStamina: 100,
    });

    this.setCollideWorldBounds(true);

    this.playerState = "idle";

    this.attackCooldown = 500;
    this.canAttack = true;
  }

  static preload(scene) {
    scene.load.atlas("survivor", "assets/player/survivor.png", "assets/player/survivor_atlas.json");

    scene.load.animation("survivor_anim", "assets/player/survivor_anim.json");
  }

  moveToPosition(x, y) {
    // centerOffsetX = x - (bodyOffsetX + bodyWidth / 2 - spriteOriginOffsetX)
    // centerOffsetY = y - (bodyOffsetY + bodyHeight / 2 - spriteOriginOffsetY)

    const centerOffsetX = x - (80 + 32 / 2 - 192 * 0.5);
    const centerOffsetY = y - (96 + 32 / 2 - 192 * 0.5);
    this.setPosition(centerOffsetX, centerOffsetY);
  }

  moveToGrid(gridX, gridY) {
    const worldX = gridX * 32 + 16;
    const worldY = gridY * 32 + 16;

    this.moveToPosition(worldX, worldY);
  }

  attackMelee() {
    if (!this.canAttack) return;

    this.canAttack = false;
    this.playerState = "attack";

    // Animation
    this.playAttackAnimation();

    // Hit
    this.scene.time.delayedCall(100, () => {
      this.doMeleeHit();
    });

    this.scene.time.delayedCall(this.attackCooldown, () => {
      this.canAttack = true;
      this.playerState = "idle";
    });
  }

  playAttackAnimation() {
    switch (this.movement.facing) {
      case "up":
        this.play("survivor_attack_up", true);
        break;

      case "down":
        this.play("survivor_attack_down", true);
        break;

      case "left":
        this.play("survivor_attack_left", true);
        break;

      case "right":
        this.play("survivor_attack_right", true);
        break;
    }
  }

  doMeleeHit() {
    let hitX = this.body.center.x;
    let hitY = this.body.center.y;
    let hitWidth = 48;
    let hitHeight = 32;

    const distance = 32;

    switch (this.movement.facing) {
      case "up":
        hitY -= distance;
        hitWidth = 64;
        break;
      case "down":
        hitY += distance;
        hitWidth = 64;
        break;
      case "left":
        hitX -= distance;
        hitHeight = 64;
        break;
      case "right":
        hitX += distance;
        hitHeight = 64;
        break;
    }

    const hitbox = this.scene.add.zone(hitX, hitY, hitWidth, hitHeight);

    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);

    // Enemy
    const hitEnemies = new Set();
    this.scene.physics.add.overlap(hitbox, this.scene.combatSystem.enemies, (_, enemy) => {
      if (hitEnemies.has(enemy)) return;

      hitEnemies.add(enemy);

      enemy.takeDamage(1);
    });

    // Tree
    const hitTrees = new Set();
    this.scene.physics.add.overlap(hitbox, this.scene.trees, (_, tree) => {
      if (hitTrees.has(tree)) return;

      hitTrees.add(tree);
      tree.takeDamage(1);
    });

    // Rock
    const hitRocks = new Set();
    this.scene.physics.add.overlap(hitbox, this.scene.rocks, (_, rock) => {
      if (hitRocks.has(rock)) return;

      hitRocks.add(rock);
      rock.takeDamage(1);
    });

    // Clear hitbox
    this.scene.time.delayedCall(80, () => {
      hitbox.destroy();
    });
  }

  takeDamage(amount, source) {
    this.health.takeDamage(amount);

    this.scene.damageTextSystem.showDamage(this.body.center.x, this.body.center.y, amount, "#ff0000"); // prettier-ignore

    // visual feedback
    this.setTint(0xff0000);
    this.scene.cameras.main.shake(100, 0.01);

    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });
  }

  enterDead() {
    this.die();
  }

  die() {
    if (this.scene.gameStateManager.isGameOver()) return;

    this.scene.gameStateManager.gameOver();

    const message = "YOU DIED\n";
    this.scene.gameOverUI.showGameOverScreen(message);

    this.setVelocity(0, 0);
    this.setTint(0x555555);
  }

  update(delta) {
    if (!this.active) return;
    this.setDepth(this.body.center.y);

    if (this.playerState === "attack") {
      this.setVelocity(0, 0);
      return;
    }

    const move = this.scene.inputController.state.moveVector;

    this.movement.update(move, delta);

    if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
      this.anims.play(`survivor_idle_${this.movement.facing}`, true);
    } else {
      this.anims.play(`survivor_walk_${this.movement.facing}`, true);
    }
  }
}
