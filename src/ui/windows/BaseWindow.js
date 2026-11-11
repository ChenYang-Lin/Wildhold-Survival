export default class BaseWindow {
  constructor(scene, title, html) {
    this.scene = scene;
    this.title = title;
    this.visible = false;
    this.destroyed = false;

    // Create a normal HTML element.
    this.element = document.createElement("div");

    this.element.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    this.element.addEventListener("pointerup", (event) => {
      event.stopPropagation();
    });

    this.element.addEventListener("click", (event) => {
      event.stopPropagation();
    });

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

    // Disable Phaser input while the HTML window is open.
    if (visible && !this.visible) {
      this.previousInputEnabled = this.scene.input.enabled;
      this.scene.input.enabled = false;
    }

    // Restore the previous input state when the window closes.
    if (!visible && this.visible) {
      if (this.previousInputEnabled !== undefined) {
        this.scene.input.enabled = this.previousInputEnabled;
        this.previousInputEnabled = undefined;
      }
    }

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
