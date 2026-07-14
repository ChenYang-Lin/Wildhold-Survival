export default class PathfindingManager {
  constructor(scene) {
    this.scene = scene;
  }

  findPath(startGridX, startGridY, endGridX, endGridY) {
    console.log("Finding Path: ", startGridX, startGridY, " ->", endGridX, endGridY);

    const grid = this.buildGrid();

    console.log(grid);

    const node = {
      gridX: startGridX,
      gridY: startGridY,

      g: 0,
      h: 0,
      f: 0,

      parent: null,
    };

    return [];
  }

  buildGrid() {
    const map = this.scene.mapManager.map;
    const width = map.width;
    const height = map.height;

    const grid = [];

    // // Remove previous debug graphics
    // this.debugGraphics?.destroy();

    // this.debugGraphics = this.scene.add.graphics();
    // this.debugGraphics.setDepth(100000); // draw on top of everything

    for (let y = 0; y < height; y++) {
      grid[y] = [];

      for (let x = 0; x < width; x++) {
        const walkable = !this.scene.mapManager.isTileBlocked(x, y);

        grid[y][x] = walkable;

        const worldX = x * map.tileWidth;
        const worldY = y * map.tileHeight;

        // // DEBUG:
        // this.debugGraphics.fillStyle(walkable ? 0x00ff00 : 0xff0000, 0.35);
        // this.debugGraphics.fillRect(worldX, worldY, map.tileWidth, map.tileHeight);

        // // Optional: draw tile border
        // this.debugGraphics.lineStyle(1, 0x000000, 0.3);
        // this.debugGraphics.strokeRect(worldX, worldY, map.tileWidth, map.tileHeight);
      }
    }

    return grid;
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  getNeighbors(node, grid) {
    const neighbors = [];

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const x = node.gridX + dir.x;
      const y = node.gridY + dir.y;

      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
        continue;
      }

      if (!grid[y][x]) continue;

      neighbors.push({
        gridX: x,
        gridY: y,
      });
    }

    return neighbors;
  }
}
