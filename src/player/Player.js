import AnimationComponent from "../components/AnimationComponent.js";
import AttackComponent from "../components/AttackComponent.js";
import HealthComponent from "../components/HealthComponent.js";
import MovementComponent from "../components/MovementComponent.js";
import StatsComponent from "../components/StatsComponent.js";
import PlayerCombatFSM from "./fsm/PlayerCombatFSM.js";
import PlayerMovementFSM from "./fsm/PlayerMovementFSM.js";

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
      attackSpeed: 2,
      stamina: 100,
      maxStamina: 100,
      staminaDrainRate: 20,
      staminaRegenRate: 20,
    });

    this.attack = new AttackComponent(this);

    this.movementFSM = new PlayerMovementFSM(this);
    this.combatFSM = new PlayerCombatFSM(this);
    this.animation = new AnimationComponent(this);
  }

  static preload(scene) {
    scene.load.atlas("survivor", "assets/player/survivor.png", "assets/player/survivor_atlas.json");
    scene.load.animation("survivor_anim", "assets/player/survivor_anim.json");

    scene.load.atlas("survivor_attack", "assets/player/survivor_attack.png", "assets/player/survivor_attack_atlas.json");
    scene.load.animation("survivor_attack_anim", "assets/player/survivor_attack_anim.json");
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

    const input = this.scene.inputController.state;

    // Dash pressed => cancel attack and enter dash state in movementFSM.
    if (input.dashPressed && this.movementFSM.state !== this.movementFSM.STATE_DASH) {
      this.combatFSM.cancelAttack();
      this.movementFSM.enterDash(input);
    }

    if (this.movementFSM.state === this.movementFSM.STATE_DASH) {
      this.movementFSM.update(input, delta);
    } else {
      this.combatFSM.update(input, delta);

      if (!this.combatFSM.locksMovement()) {
        this.movementFSM.update(input, delta);
      }
    }

    this.animation.update();
  }
}
