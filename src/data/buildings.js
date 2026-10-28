export const BUILDINGS = {
  base: {
    id: "base",
    name: "Base",
    texture: "base",
    width: 3,
    height: 2,
    spriteWidth: 96,
    spriteHeight: 96,
    footprintWidth: 96,
    footprintHeight: 64,
    footprintOffsetX: 0,
    footprintOffsetY: 1,
  },

  campfire: {
    id: "campfire",
    name: "campfire",
    texture: "campfire",
    icon: "campfire",

    width: 1,
    height: 1,

    spriteWidth: 32,
    spriteHeight: 64,

    footprintWidth: 32,
    footprintHeight: 32,

    footprintOffsetX: 0,
    footprintOffsetY: 1,

    cost: {
      wood: 2,
    },

    repairCost: {
      wood: 1,
    },

    maxLevel: 3,

    upgrades: {
      2: {
        cost: { wood: 4 },
        maxHP: 20,
      },
      3: {
        cost: { wood: 8 },
        maxHP: 30,
      },
    },
  },

  wall: {
    id: "wall",
    name: "Wall",
    texture: "wall",
    icon: "wall",

    width: 1,
    height: 1,

    spriteWidth: 32,
    spriteHeight: 32,

    footprintWidth: 32,
    footprintHeight: 32,

    footprintOffsetX: 0,
    footprintOffsetY: 0,

    cost: {
      wood: 2,
    },

    repairCost: {
      wood: 1,
    },

    maxLevel: 3,

    upgrades: {
      2: {
        cost: { wood: 4 },
        maxHP: 20,
      },
      3: {
        cost: { wood: 8 },
        maxHP: 30,
      },
    },
  },

  tower: {
    id: "tower",
    name: "Tower",
    texture: "tower",
    icon: "tower",

    width: 2,
    height: 2,

    spriteWidth: 64,
    spriteHeight: 128,

    footprintWidth: 64,
    footprintHeight: 64,

    footprintOffsetX: 0,
    footprintOffsetY: 2,

    cost: {
      wood: 5,
      stone: 3,
    },

    repairCost: {
      wood: 2,
      stone: 1,
    },

    maxLevel: 3,

    upgrades: {
      2: {
        cost: { wood: 8, stone: 5 },
        maxHP: 15,
        damage: 2,
        range: 240,
      },
      3: {
        cost: { wood: 12, stone: 8 },
        maxHP: 20,
        damage: 3,
        range: 280,
      },
    },
  },

  spike: {
    id: "spike",
    name: "Spike",
    texture: "spike",
    icon: "spike",

    width: 1,
    height: 1,

    spriteWidth: 32,
    spriteHeight: 32,

    footprintWidth: 32,
    footprintHeight: 32,

    footprintOffsetX: 0,
    footprintOffsetY: 0,

    cost: {
      wood: 2,
      stone: 1,
    },

    repairCost: {
      wood: 1,
    },

    maxLevel: 1,

    upgrades: {},
  },
};
