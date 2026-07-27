export default class BuffFactory {
  createSpeedBuff() {
    return {
      id: Phaser.Math.RND.uuid(),

      type: "speed",

      duration: 5000,

      stat: "speed",

      operation: "multiply",

      value: 1.5,
    };
  }

  createDamageBuff() {
    return {
      id: Phaser.Math.RND.uuid(),

      type: "damage",

      duration: 5000,

      stat: "damage",

      operation: "multiply",

      value: 2,
    };
  }

  createShieldBuff() {
    return {
      id: Phaser.Math.RND.uuid(),

      type: "shield",

      duration: 4000,

      shieldAmount: 10,
    };
  }
}
