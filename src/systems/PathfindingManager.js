export default class PathfindingManager {
  constructor(scene) {
    this.scene = scene;

    // DEBUG
    this.debugBlockGraphics = null; // draw blocked tiles; red -> blocked; green -> walkable
    this.debugPathGraphics = null; // draw the path

    this.debugBlockGraphicsOn = false;
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

  findPath(startGridX, startGridY, endGridX, endGridY, type) {
    const grid = this.buildGrid(type);

    const startNode = grid[startGridY][startGridX].node;

    startNode.g = 0;
    startNode.h = this.heuristic(startGridX, startGridY, endGridX, endGridY);
    startNode.f = startNode.g + startNode.h;

    const openList = [startNode];

    const closedSet = new Set();

    while (openList.length > 0) {
      // Find the node with the smallest F score
      let current = openList[0];

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < current.f) {
          current = openList[i];
        }
      }

      // Remove the node from the open list
      openList.splice(openList.indexOf(current), 1);

      // Add the node to the closed Set.
      closedSet.add(`${current.gridX},${current.gridY}`);

      // Check if we've reached the destination
      if (current.gridX === endGridX && current.gridY === endGridY) {
        const path = this.reconstructPath(current);

        this.drawDebugPath(path);

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

    this.debugPathGraphics?.destroy();

    return [];
  }

  buildGrid(type) {
    const map = this.scene.mapManager.map;
    const width = map.width;
    const height = map.height;

    const grid = [];

    for (let gridY = 0; gridY < height; gridY++) {
      grid[gridY] = [];

      for (let gridX = 0; gridX < width; gridX++) {
        let walkable = !this.scene.mapManager.isTileBlocked(gridX, gridY);

        switch (type) {
          case "enemy":
            walkable = !this.scene.mapManager.isTileBlocked(gridX, gridY);
            break;

          case "ignoreBuildings":
            walkable = !this.scene.mapManager.isTileCollidable(gridX, gridY);
            break;
        }
        grid[gridY][gridX] = {
          walkable: walkable,
          node: this.createNode(gridX, gridY),
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
      // const world = this.scene.mapManager.gridToWorld(current.gridX, current.gridY);
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
    if (!this.scene.DEBUG_MODE) {
      return;
    }

    console.log("start toggleDebugTileBlcok()");
    if (this.debugBlockGraphicsOn) {
      this.debugBlockGraphicsOn = false;

      // Remove debug graphics
      this.debugBlockGraphics?.destroy();
      this.debugPathGraphics?.destroy();
    } else {
      this.debugBlockGraphicsOn = true;

      const map = this.scene.mapManager.map;
      const width = map.width;
      const height = map.height;

      this.debugBlockGraphics = this.scene.add.graphics();
      this.debugBlockGraphics.setDepth(100000); // draw on top of everything

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const walkable = !this.scene.mapManager.isTileBlocked(x, y);

          const worldX = x * map.tileWidth;
          const worldY = y * map.tileHeight;

          this.debugBlockGraphics.fillStyle(walkable ? 0x00ff00 : 0xff0000, 0.35);
          this.debugBlockGraphics.fillRect(worldX, worldY, map.tileWidth, map.tileHeight);

          // Optional: draw tile border
          this.debugBlockGraphics.lineStyle(1, 0x000000, 0.3);
          this.debugBlockGraphics.strokeRect(worldX, worldY, map.tileWidth, map.tileHeight);
        }
      }
    }
  }

  drawDebugPath(path) {
    if (!this.scene.DEBUG_MODE) {
      return;
    }
    this.debugPathGraphics?.destroy();

    this.debugPathGraphics = this.scene.add.graphics();
    this.debugPathGraphics.setDepth(100001);

    const tileSize = this.scene.mapManager.map.tileWidth;

    this.debugPathGraphics.fillStyle(0x0000ff, 0.4);

    for (const point of path) {
      this.debugPathGraphics.fillRect(point.gridX * tileSize, point.gridY * tileSize, tileSize, tileSize);
    }
  }
}
