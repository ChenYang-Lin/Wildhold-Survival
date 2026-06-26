import { BUILDINGS } from "../data/buildings.js";
import Building from "./Building.js";

export default class Wall extends Building {
  constructor(scene, x, y) {
    super(scene, x, y, "wall");

    const offsetX = BUILDINGS["wall"].footprintOffsetX * 32;
    const offsetY = BUILDINGS["wall"].footprintOffsetY * 32;
    this.body.setOffset(offsetX, offsetY); // prettier-ignore

    this.setDepth(this.body.center.y);
  }
}
