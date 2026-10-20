export default class HealthUI {
  constructor(scene) {
    this.scene = scene;

    const isMobile = scene.sys.game.device.input.touch;

    // Layout
    this.barWidth = 80;
    this.levelSize = 12;
    this.barHeight = this.levelSize;
    this.frameThickness = 2;
    this.playerYOffset = isMobile ? 22 : 26;

    this.innerWidth = this.barWidth - this.frameThickness * 2;
    this.innerHeight = this.barHeight - this.frameThickness * 2;

    this.barLeft = this.levelSize / 2;
    this.barCenterX = this.barLeft + this.barWidth / 2;
    this.fillLeft = this.barLeft + this.frameThickness;
    this.fillTop = -this.innerHeight / 2;

    this.lastMaxHP = null;
    this.lastLevel = null;
    this.lastHP = null;

    this.damageDelay = 100;
    this.damageDuration = 250;

    this.damageState = { width: 0 };
    this.damageTween = null;
    this.damageTimer = null;

    // One container keeps the badge and bar aligned.
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);

    // Level badge: dark.
    this.levelBackground = scene.add.rectangle(0, 0, this.levelSize, this.levelSize, 0x20242b, 1);

    this.levelText = scene.add
      .text(0, 0, "1", {
        fontFamily: "Arial",
        fontSize: isMobile ? "8px" : "8px",
        fontStyle: "bold",
        color: "#fff1c2",
        stroke: "#17191e",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    // Outer frame. Drawn as a solid dark rectangle.
    this.frame = scene.add.rectangle(this.barCenterX, 0, this.barWidth, this.barHeight, 0x101217, 1);

    // Dark area behind the health fill.
    this.background = scene.add.rectangle(this.fillLeft + this.innerWidth / 2, 0, this.innerWidth, this.innerHeight, 0x080a0d, 1);

    // Health fill.
    this.fill = scene.add.rectangle(this.fillLeft, 0, 0, this.innerHeight, 0x43c83e, 1);
    this.fill.setOrigin(0, 0.5);

    // Damage trail remains behind the main fill.
    this.damageTrail = scene.add.rectangle(this.fillLeft, 0, 0, this.innerHeight, 0xc6a04a, 1);
    this.damageTrail.setOrigin(0, 0.5);

    this.divisions = scene.add.graphics();

    // Order matters: the trim is drawn last to stay visible.
    this.container.add([this.frame, this.background, this.damageTrail, this.fill, this.divisions, this.levelBackground, this.levelText]);

    // update the health UI after the physics step: solves the health bar jittering issue.
    this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);

    this.update();
  }

  drawHealthDivisions(maxHP) {
    this.divisions.clear();

    if (!Number.isFinite(maxHP) || maxHP <= 0) return;

    const top = -this.innerHeight / 2;
    const middle = 0; // 50% height marker (for 10-HP ticks)
    const bottom = this.innerHeight / 2;

    // Calculate a precise 75% height line starting from the top down
    const threeQuarterHeight = top + this.innerHeight * 0.75;

    // ==========================================
    // PHASE 1: LOW HEALTH MODE (Below 400 HP)
    // ==========================================
    if (maxHP < 400) {
      // 10-HP Ticks: Drawn as Half-Ticks (top to middle)
      this.divisions.lineStyle(1, 0x000000, 0.4);
      for (let hp = 10; hp < maxHP; hp += 10) {
        if (hp % 100 === 0) continue; // Skip 100 marks so they can be full ticks

        const x = Math.round(this.fillLeft + (hp / maxHP) * this.innerWidth);
        this.divisions.beginPath();
        this.divisions.moveTo(x, top);
        this.divisions.lineTo(x, middle);
        this.divisions.strokePath();
      }

      // 100-HP Ticks: Always Full-Ticks here because maxHP is below 1000
      this.divisions.lineStyle(1, 0x000000, 0.8);
      for (let hp = 100; hp < maxHP; hp += 100) {
        const x = Math.round(this.fillLeft + (hp / maxHP) * this.innerWidth);
        this.divisions.beginPath();
        this.divisions.moveTo(x, top);
        this.divisions.lineTo(x, bottom);
        this.divisions.strokePath();
      }
    }
    // ==========================================
    // PHASE 2: HIGH HEALTH MODE (400 HP and Above)
    // ==========================================
    else {
      // 10-HP ticks are completely removed starting at 400 HP.

      // 100-HP Ticks: Only drawn if BELOW 4000 HP.
      if (maxHP < 4000) {
        this.divisions.lineStyle(1, 0x000000, 0.6);
        for (let hp = 100; hp < maxHP; hp += 100) {
          if (hp % 1000 === 0) continue; // Skip 1000 marks so they can be thick whole ticks

          const x = Math.round(this.fillLeft + (hp / maxHP) * this.innerWidth);
          this.divisions.beginPath();
          this.divisions.moveTo(x, top);

          // 🌟 CONDITIONAL HEIGHT CONFIGURATION:
          // If maxHP is over 1000, drop the 100-HP tick down to 75% height.
          // Otherwise (between 400 and 1000), keep it as a full-height tick.
          if (maxHP > 1000) {
            this.divisions.lineTo(x, threeQuarterHeight);
          } else {
            this.divisions.lineTo(x, bottom);
          }

          this.divisions.strokePath();
        }
      }

      // 1000-HP Ticks: Always drawn as Thick Whole-Ticks (top to bottom)
      this.divisions.lineStyle(2, 0x000000, 1.0);
      for (let hp = 1000; hp < maxHP; hp += 1000) {
        const x = Math.round(this.fillLeft + (hp / maxHP) * this.innerWidth);
        this.divisions.beginPath();
        this.divisions.moveTo(x, top);
        this.divisions.lineTo(x, bottom);
        this.divisions.strokePath();
      }
    }
  }

  stopDamageAnimation() {
    this.damageTween?.stop();
    this.damageTimer?.remove(false);

    this.damageTween = null;
    this.damageTimer = null;
  }

  setDamageTrailWidth(width) {
    this.damageState.width = Phaser.Math.Clamp(width, 0, this.innerWidth);
    this.damageTrail.setSize(this.damageState.width, this.innerHeight);
  }

  animateDamage(previousWidth, targetWidth) {
    this.stopDamageAnimation();

    this.setDamageTrailWidth(Math.max(previousWidth, targetWidth));

    this.damageTimer = this.scene.time.delayedCall(this.damageDelay, () => {
      this.damageTimer = null;

      this.damageTween = this.scene.tweens.add({
        targets: this.damageState,
        width: targetWidth,
        duration: this.damageDuration,
        ease: "Quad.easeOut",
        onUpdate: () => {
          this.setDamageTrailWidth(this.damageState.width);
        },
        onComplete: () => {
          this.damageTween = null;
          this.setDamageTrailWidth(targetWidth);
        },
      });
    });
  }

  updateScreenPosition() {
    const player = this.scene.player;
    if (!player || !this.container) return;

    const totalWidth = this.levelSize + this.barWidth;

    // Positions the container cleanly using the rounded player values
    this.container.setPosition(player.x - totalWidth / 2, player.y - this.playerYOffset);
  }

  update() {
    const player = this.scene.player;

    if (!player?.health || !this.container) return;

    const { hp, maxHP } = player.health;

    if (!Number.isFinite(maxHP) || maxHP <= 0) return;

    const currentHP = Phaser.Math.Clamp(Number.isFinite(hp) ? hp : 0, 0, maxHP);

    const targetWidth = this.innerWidth * (currentHP / maxHP);

    if (this.lastMaxHP !== maxHP) {
      this.drawHealthDivisions(maxHP);
      this.lastMaxHP = maxHP;

      this.stopDamageAnimation();
      this.setDamageTrailWidth(targetWidth);
    } else if (this.lastHP !== null && currentHP < this.lastHP) {
      const previousWidth = Math.max(this.damageState.width, this.innerWidth * (this.lastHP / maxHP));

      this.animateDamage(previousWidth, targetWidth);
    } else if (this.lastHP !== null && currentHP > this.lastHP) {
      this.stopDamageAnimation();
      this.setDamageTrailWidth(targetWidth);
    }

    this.fill.setSize(targetWidth, this.innerHeight);
    this.fill.setFillStyle(0x43c83e);

    // Keep the trail at least as wide as the current fill.
    if (!this.damageTween && !this.damageTimer) {
      this.setDamageTrailWidth(targetWidth);
    }

    const level = Number.isFinite(player.level) ? player.level : 23;

    if (this.lastLevel !== level) {
      this.levelText.setText(String(level));
      this.lastLevel = level;
    }

    this.lastHP = currentHP;

    this.container.setDepth(1000);
  }

  resetUIPosition() {
    this.update();
  }

  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this);

    this.stopDamageAnimation();
    this.container?.destroy(true);
    this.container = null;
  }
}
