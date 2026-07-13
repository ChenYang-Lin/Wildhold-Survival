export default class NavigationManager {
  constructor(scene) {
    this.scene = scene;

    this.nodes = new Map();

    this.loadNavigation();
  }

  loadNavigation() {
    const layer = this.scene.mapManager.map.getObjectLayer("Navigation");

    for (const object of layer.objects) {
      const node = {
        name: object.name,

        type: object.properties.find((p) => p.name === "type")?.value,

        nextNames:
          object.properties
            .find((p) => p.name === "next")
            ?.value.split(",")
            .map((s) => s.trim())
            .filter(Boolean) ?? [],

        x: object.x,
        y: object.y,

        gridX: 0,
        gridY: 0,

        next: [],
      };

      const { gridX, gridY } = this.scene.mapManager.worldToGrid(object.x, object.y);

      node.gridX = gridX;
      node.gridY = gridY;

      this.nodes.set(node.name, node);
    }

    for (const node of this.nodes.values()) {
      for (const nextName of node.nextNames) {
        const nextNode = this.nodes.get(nextName);

        if (!nextNode) {
          console.warn(`Navigation node "${nextName}" not found.`);
          continue;
        }
        node.next.push(nextNode);
      }
      delete node.nextNames;
    }
  }

  getNode(name) {
    return this.nodes.get(name);
  }

  getBaseNode() {
    for (const node of this.nodes.values()) {
      if (node.type === "base") {
        return node;
      }
    }

    return null;
  }

  getCampNode(id) {
    return this.nodes.get(`Camp_${id}`);
  }

  chooseNextNode(currentNode) {
    if (currentNode.next.length === 0) {
      return null;
    }

    return Phaser.Utils.Array.GetRandom(currentNode.next);
  }

  isAtNode(enemy, node) {
    const distance = Phaser.Math.Distance.Between(enemy.body.center.x, enemy.body.center.y, node.x, node.y);

    return distance < 32;
  }
}
