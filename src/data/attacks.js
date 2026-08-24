const melee1 = {
  type: "melee",
  damageMultiplier: 1,
  hitTimeRatio: 0.4,
  hitboxDuration: 80,
  comboWindowStartRatio: 0.6,
  animation: {
    up: "survivor_attack_3_up",
    down: "survivor_attack_2_down",
    left: "survivor_attack_2_left",
    right: "survivor_attack_2_right",
  },
};

const melee2 = {
  type: "melee",
  damageMultiplier: 1.25,
  hitTimeRatio: 0.4,
  hitboxDuration: 80,
  comboWindowStartRatio: 0.6,
  animation: {
    up: "survivor_attack_2_up",
    down: "survivor_attack_3_down",
    left: "survivor_attack_3_left",
    right: "survivor_attack_3_right",
  },
};

const melee3 = {
  type: "melee",
  damageMultiplier: 1.5,
  hitTimeRatio: 0.5,
  hitboxDuration: 100,
  comboWindowStartRatio: 0.6,
  animation: {
    up: "survivor_attack_3_up",
    down: "survivor_attack_2_down",
    left: "survivor_attack_2_left",
    right: "survivor_attack_2_right",
  },
  knockback: 100,
};

export const meleeCombo = [melee1, melee2, melee3];

export const sprintAttack = {
  type: "sprint",
  damageMultiplier: 1.5,
  hitTimeRatio: 0.25,
  hitboxDuration: 80,
  knockback: 150,

  lunge: {
    speed: 200,
    duration: 150,
  },

  animation: {
    up: "survivor_sprint_attack_up",
    down: "survivor_sprint_attack_down",
    left: "survivor_sprint_attack_left",
    right: "survivor_sprint_attack_right",
  },
};
