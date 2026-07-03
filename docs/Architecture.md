# Architecture

## Major Systems

GameScene
│
├── Player
├── Campfire
│
├── CombatSystem
│ └── Enemy
│
├── BuildingManager
│ ├── Wall
│ ├── Tower (future)
│ └── Trap (future)
│
├── InventorySystem
│
├── ActionSystem
│
├── InputController
│
├── HealthUI
│
├── WaveSystem (future)
│
└── BlueprintSystem (future)

---

## Inventory Architecture

Inventory
├── Resources
│ ├── Wood
│ ├── Stone
│ └── Future Resources
│
├── Weapons
│ ├── Wooden Sword
│ ├── Iron Sword
│ ├── Bow
│ └── Future Weapons
│
├── Consumables
│ ├── Food
│ ├── Potions
│ └── Future Consumables
│
└── Blueprints

---

## Hotbar Architecture

## Combat Mode

Displays Weapons Only

Example:
[Sword] [Bow] [Staff]

## Build Mode

Displays Placeables Only

Example:
[Wall] [Tower] [Trap]

## Quick Slots

Food Slot
Potion Slot

Always visible.

---

## Input Philosophy

## Combat Mode

Attack
Swap Weapon

## Build Mode

Place Building

## Quick Use

Q = Potion
R = Food

## Inventory

Open inventory and manage equipment.

---

## Building System

BuildingManager

Responsibilities:

- Placement validation
- Tile occupation tracking
- Building lookup

Buildings:

- Wall
- Tower (future)
- Trap (future)

---

## Enemy AI Philosophy

Priority:

1. Nearby Player
2. Campfire

If blocked: 3. Attack obstacle

Enemy States:

- Chasing
- Attacking Target
- Attacking Wall

Future:

- Special enemies
- Ranged enemies
- Bosses

---

## Health System

Every damageable object implements:

takeDamage(amount, source)

Examples:

- Player
- Enemy
- Campfire
- Wall
- Tower

This keeps combat consistent.

---

## Entities

Player
Enemy
Wall
Campfire
Tree

---

## Combat

Player.attackMelee()
↓
Spawn hitbox
↓
Damage Enemy / Tree

Enemy.update()
↓
Pick target
↓
Move
↓
Attack target

---

## Building

Build Mode
↓
Select structure
↓
Check resource cost
↓
BuildingManager.placeBuilding()
↓
Consume resources

---

## Inventory

Stores:

- Resources
- Consumables

Does NOT store:

- Walls
- Towers
- Traps

Those are build recipes.

---

## Unlock System

Inventory

- BlueprintManager (future)

BlueprintManager determines:

- which weapons available
- which buildings available

Combat Hotbar and Build Hotbar are generated from unlocked content.

---

## Equipment System

Purpose:
Separate combat equipment from inventory items.

Modes:

- Combat
- Build

Combat Mode:

- Weapon hotbar

Build Mode:

- Building hotbar

Consumables:

- Dedicated quick-use slot

WaveManager
├── currentWave
├── enemiesRemaining
├── enemiesAlive
├── startWave()
├── spawnEnemy()
├── onEnemyKilled()
├── isWaveFinished()
├── endWave()
└── nextWave()
