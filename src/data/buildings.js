export const BUILDINGS = {
  wall: {
    id: "wall",
    texture: "wall",

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
  },

  tower: {
    id: "tower",
    texture: "tower",

    width: 2,
    height: 2,

    spriteWidth: 64,
    spriteHeight: 128,

    footprintWidth: 64,
    footprintHeight: 64,

    footprintOffsetX: 0,
    footprintOffsetY: 2,

    cost: {
      wood: 10,
    },
  },
};
