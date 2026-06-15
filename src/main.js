import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,

  backgroundColor: "#2d2d2d",

  render: {
    pixelArt: true,
    antialias: false,
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1,
  },

  resolution: 1,

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },

  scene: [GameScene],
};

new Phaser.Game(config);
