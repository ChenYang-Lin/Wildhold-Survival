export default class PathfindingManager {
  constructor(scene) {
    this.scene = scene;

    // DEBUG
    this.debugGraphics = null;
    this.debugTileBlockOn = false;
  }

  createNode(gridX, gridY) {
    return {
      gridX,
      gridY,

      g: Infinity,
      h: 0,
      f: Infinity,

      parent: null,
    };
  }

  findPath(startGridX, startGridY, endGridX, endGridY) {
    console.log("Finding Path: ", startGridX, startGridY, " ->", endGridX, endGridY);

    const grid = this.buildGrid();

    const startNode = grid[startGridY][startGridX].node;

    startNode.g = 0;
    startNode.h = this.heuristic(startGridX, startGridY, endGridX, endGridY);
    startNode.f = startNode.g + startNode.h;

    const openList = [startNode];

    const closedSet = new Set();

    while (openList.length > 0) {
      // Find the node with the smallest F score
      let current = openList[0];

      for (const node of openList) {
        if (node.f < current.f) {
          current = node;
        }
      }

      // Remove the node from the open list
      openList.splice(openList.indexOf(current), 1);

      // Add the node to the closed Set.
      closedSet.add(`${current.gridX},${current.gridY}`);

      // Check if we've reached the destination
      if (current.gridX === endGridX && current.gridY === endGridY) {
        console.log("Path Found");

        const path = this.reconstructPath(current);

        console.log(path);

        return path;
      }

      // Check every reachable tile around the current tile
      const neighbors = this.getNeighbors(current, grid);
      for (const neighbor of neighbors) {
        // Ignore the nodes already visited.
        const key = `${neighbor.gridX},${neighbor.gridY}`;
        if (closedSet.has(key)) continue;

        const tentativeG = current.g + 1;

        const inOpenList = openList.includes(neighbor);

        if (!inOpenList) {
          neighbor.h = this.heuristic(neighbor.gridX, neighbor.gridY, endGridX, endGridY);
          openList.push(neighbor);
        }

        if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
        }
      }
    }

    return [];
  }

  buildGrid() {
    const map = this.scene.mapManager.map;
    const width = map.width;
    const height = map.height;

    const grid = [];

    for (let y = 0; y < height; y++) {
      grid[y] = [];

      for (let x = 0; x < width; x++) {
        grid[y][x] = {
          walkable: !this.scene.mapManager.isTileBlocked(x, y),
          node: this.createNode(x, y),
        };
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

      if (!grid[y][x].walkable) continue;

      neighbors.push(grid[y][x].node);
    }

    return neighbors;
  }

  reconstructPath(node) {
    const path = [];

    let current = node;

    while (current) {
      path.push({
        gridX: current.gridX,
        gridY: current.gridY,
      });

      current = current.parent;
    }

    path.reverse();

    return path;
  }

  toggleDebugTileBlock() {
    console.log("start toggleDebugTileBlcok()");
    if (this.debugTileBlockOn) {
      this.debugTileBlockOn = false;

      // Remove previous debug graphics
      this.debugGraphics?.destroy();
    } else {
      this.debugTileBlockOn = true;

      const map = this.scene.mapManager.map;
      const width = map.width;
      const height = map.height;

      this.debugGraphics = this.scene.add.graphics();
      this.debugGraphics.setDepth(100000); // draw on top of everything

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const walkable = !this.scene.mapManager.isTileBlocked(x, y);

          const worldX = x * map.tileWidth;
          const worldY = y * map.tileHeight;

          this.debugGraphics.fillStyle(walkable ? 0x00ff00 : 0xff0000, 0.35);
          this.debugGraphics.fillRect(worldX, worldY, map.tileWidth, map.tileHeight);

          // Optional: draw tile border
          this.debugGraphics.lineStyle(1, 0x000000, 0.3);
          this.debugGraphics.strokeRect(worldX, worldY, map.tileWidth, map.tileHeight);
        }
      }
    }
  }
}
