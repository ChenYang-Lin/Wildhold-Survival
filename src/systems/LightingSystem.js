export default class LightingSystem {
  constructor(scene) {
    this.scene = scene;

    this.lightSources = [];

    // Fog overlay and mask -----------------------------------------------------------------------------------------------------------------------------
    const cam = this.scene.cameras.main;

    this.darknessAlpha = 0;
    this.glowAlpha = 0;
    this.flickerRadiusOffset = 0;
    this.nextFlicker = 0;

    this.lightSize = 512;

    this.visionRadius = 1000;
    this.campfireRadius = 350;

    this.darknessRT = this.scene.add
      .renderTexture(0, 0, cam.width, cam.height)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(9998);

    this.createCampfireTexture();
    this.createCampfireGlowTexture();
    this.createPlayerTexture();

    this.playerLightStamp = this.scene.add.image(0, 0, "player-light");
    this.campfireLightStamp = this.scene.add.image(0, 0, "campfire-light");
    this.campfireGlow = this.scene.add.image(0, 0, "campfire-glow").setDepth(9999); // prettier-ignore

    this.playerLightStamp.setVisible(false);
    this.campfireLightStamp.setVisible(false);
    this.campfireGlow.setVisible(false);

    // resize
    this.scene.scale.on("resize", (gameSize) => {
      this.resize(gameSize.width, gameSize.height);
    });
  }

  resize(width, height) {
    this.darknessRT.destroy();

    this.darknessRT = this.scene.add
      .renderTexture(0, 0, width, height)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(9998);
  }

  createCampfireTexture() {
    if (this.scene.textures.exists("campfire-light")) {
      return;
    }
    const size = 512;
    const radius = size / 2;

    const texture = this.scene.textures.createCanvas(
      "campfire-light",
      size,
      size,
    );

    const ctx = texture.context;

    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );

    gradient.addColorStop(0.0, "rgba(255,255,255,1.0)");
    gradient.addColorStop(0.15, "rgba(255,255,255,1.0)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.45)");
    gradient.addColorStop(0.85, "rgba(255,255,255,0.15)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    texture.refresh();
  }

  createCampfireGlowTexture() {
    if (this.scene.textures.exists("campfire-glow")) {
      return;
    }
    const size = 512;
    const radius = size / 2;

    const texture = this.scene.textures.createCanvas(
      "campfire-glow",
      size,
      size,
    );

    const ctx = texture.context;

    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    gradient.addColorStop(0.0, "rgba(255,180,50,1)");
    gradient.addColorStop(0.5, "rgba(255,120,0,0.7)");
    gradient.addColorStop(1.0, "rgba(255,80,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    texture.refresh();
  }

  createPlayerTexture() {
    if (this.scene.textures.exists("player-light")) {
      return;
    }
    const size = 512;
    const radius = size / 2;

    const texture = this.scene.textures.createCanvas(
      "player-light",
      size,
      size,
    );

    const ctx = texture.context;

    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );

    gradient.addColorStop(0.0, "rgba(255,255,255,0.30)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.22)");
    gradient.addColorStop(0.8, "rgba(255,255,255,0.15)");
    gradient.addColorStop(1.0, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    texture.refresh();
  }

  update() {
    const cam = this.scene.cameras.main;

    this.darknessRT.clear();
    this.darknessRT.fill(0x081018, this.darknessAlpha);

    // Player vision
    const scale = (this.visionRadius * 2) / this.lightSize;
    this.playerLightStamp.setScale(scale);

    this.darknessRT.erase(
      this.playerLightStamp,
      this.scene.player.body.center.x - cam.scrollX,
      this.scene.player.body.center.y - cam.scrollY,
    );

    // Campfire vision
    this.flickerTime ??= 0;
    this.flickerTime += 0.05;

    const campfireRadius = this.campfireRadius + Phaser.Math.Between(-8, 8);
    const campfireScale = (campfireRadius * 2) / this.lightSize;

    this.campfireLightStamp.setScale(campfireScale);

    this.darknessRT.erase(
      this.campfireLightStamp,
      this.scene.campfire.body.center.x - cam.scrollX,
      this.scene.campfire.body.center.y - cam.scrollY,
    );

    // Campfire glow effect (orangle color)
    this.campfireGlow.setPosition(
      this.scene.campfire.body.center.x,
      this.scene.campfire.body.center.y,
    );

    this.campfireGlow.setVisible(this.scene.dayNightSystem.isNight);

    const glowScale = (this.campfireRadius * 2.2) / this.lightSize;
    this.campfireGlow.setScale(glowScale);
    this.campfireGlow.setAlpha(
      this.glowAlpha + Math.sin(this.flickerTime) * 0.05,
    );
  }
}
