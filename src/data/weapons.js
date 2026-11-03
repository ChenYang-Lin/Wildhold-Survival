export const WEAPONS = {
  woodenSword: {
    id: "woodenSword",
    name: "Wooden Sword",
    type: "melee",
    icon: "woodenSwordIcon",

    bonuses: {
      damage: 2,
      attackSpeed: 0,
      critChance: 0.05,
      critDamage: 0,
    },
  },

  ironSword: {
    id: "ironSword",
    name: "Iron Sword",
    type: "melee",
    icon: "ironSwordIcon",

    bonuses: {
      damage: 5,
      attackSpeed: 0.1,
      critChance: 0.1,
      critDamage: 0.25,
    },
  },
};
