# Survival Defense

## Core Vision

A survival base-defense game where the player gathers resources,
builds defenses, explores the world, and protects a central campfire
from enemy waves.

The game should be easy to learn, but allow long-term progression
through exploration, blueprints, and stronger equipment.

---

## Core Gameplay Loop

1. Gather resources
   - Chop trees
   - Mine resources (future)

2. Build defenses
   - Walls
   - Towers
   - Traps

3. Explore
   - Find chests
   - Discover blueprints

4. Survive enemy waves
   - Protect campfire
   - Defend yourself

5. Upgrade
   - Better weapons
   - Better buildings
   - More blueprints

6. Repeat

---

## Player Goals

Short-Term Goals

- Gather wood
- Place walls
- Survive next wave

Mid-Term Goals

- Unlock towers
- Improve defenses
- Craft stronger weapons

Long-Term Goals

- Discover all blueprints
- Build efficient bases
- Reach higher waves

---

## Player Modes

### Combat Mode

Used for fighting enemies.

Hotbar shows:

- Wooden Sword
- Iron Sword
- Bow
- Bombs
- Future weapons

Mouse wheel or keys switch weapons.

Action button attacks.

---

### Build Mode

Used for construction.

Hotbar shows:

- Wall
- Tower
- Trap
- Future structures

Action button places building.

Buildings consume resources directly.

Example:

Wall:

- 5 Wood

Tower:

- 20 Wood
- 10 Stone

Player does NOT carry wall items.

---

## Consumable Slots

Consumables are separate from combat/build hotbars.

Slots:

Q = Consumable Slot 1
E = Consumable Slot 2

Examples:

Slot 1:

- Food

Slot 2:

- Health Potion

Consumables are equipped from inventory.

---

## Resources

Resources are stored in inventory.

Examples:

- Wood
- Stone
- Iron Ore

Resources are used directly when building.

Resources are NOT placed in hotbar.

---

## Campfire

Primary base objective.

If campfire HP reaches 0:

Game Over

---

## Enemy Priorities

1. Attack nearby player
2. Attack campfire
3. Destroy blocking walls

Enemies attack walls when physically blocked.

---

## Design Principles

- Simple controls
- Meaningful building placement
- Exploration is rewarding
- Defenses should feel valuable
- Player should never feel forced to watch ads

---

## Monetization Philosophy

Reward Ads:

- Revive
- Bonus chest
- Resource boost

Never:

- Blueprint unlocks
- Weapon unlocks
- Required progression
