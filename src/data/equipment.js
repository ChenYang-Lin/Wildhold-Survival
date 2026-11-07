export const EQUIPMENT = {
  wooden_sword: {
    id: "wooden_sword",
    name: "Wooden Sword",
    category: "weapon",
    icon: "equipment_sword_wooden",
    bonuses: {
      damage: 5,
      attackSpeedMultiplier: 1.1,
    },
  },

  steel_helmet: {
    id: "steel_helmet",
    name: "Steel Helmet",
    category: "helmet",
    icon: "equipment_helmet_steel",
    bonuses: {
      maxHealth: 10,
      critChance: 0.02,
    },
  },

  steel_armor: {
    id: "steel_armor",
    name: "Steel Armor",
    category: "armor",
    icon: "equipment_armor_steel",
    bonuses: {
      maxHealth: 20,
      movementSpeedMultiplier: 0.95,
    },
  },

  leather_boots: {
    id: "leather_boots",
    name: "Leather Boots",
    category: "boots",
    icon: "equipment_boot_leather",
    bonuses: {
      movementSpeedMultiplier: 1.1,
      critDamage: 0.2,
    },
  },
};
