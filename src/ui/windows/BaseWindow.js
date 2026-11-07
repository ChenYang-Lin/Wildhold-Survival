export default class BaseWindow {
  constructor(scene, title, html) {
    this.scene = scene;
    this.title = title;
    this.visible = false;
    this.destroyed = false;

    // Create a normal HTML element.
    this.element = document.createElement("div");

    // Add the window content.
    this.element.innerHTML = html;

    // Position the window independently of Phaser.
    Object.assign(this.element.style, {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "10000",
      display: "none",
      pointerEvents: "auto",
    });

    // Add the window to the webpage.
    document.body.appendChild(this.element);

    // Clean up when the Phaser scene shuts down.
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  setVisible(visible) {
    if (this.destroyed) return;

    this.visible = visible;
    this.element.style.display = visible ? "flex" : "none";
  }

  show() {
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    this.element.remove();
    this.element = null;
  }
}
