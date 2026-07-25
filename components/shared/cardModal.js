class CardModal {
  constructor(title, body, closeCallback = null, options = {}) {
    this.modal = null;
    this.settings = {
      isDragging: false,
      isResizing: false,
      initialX: 0,
      initialY: 0,
      initialWidth: 0,
      initialHeight: 0,
    };

    // FIXED: Explicitly bind and cache methods so they can be removed perfectly from document memory
    this.boundMouseMove = this.mouseMoveDrag.bind(this);
    this.boundMouseUp = this.mouseUpDrag.bind(this);

    this.createCardModal(title, body, closeCallback, options);
  }

  createCardModal(title, body, closeCallback, options) {
    this.modal = document.createElement("div");
    this.modal.className =
      "ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-resizable c20-modal-card";
    this.modal.style.display = "block";
    this.modal.style.visibility = "hidden";

    if (window.innerWidth > 790) {
      this.modal.style.width = options?.width || "500px";
    } else {
      this.modal.style.width = "calc(100vw - 50px)";
    }

    this.modal.style.left = `calc((100vw - ${this.modal.style.width}) / 2)`;
    this.modal.style.zIndex = "11003";

    const container = document.createElement("div");
    container.style.height = "100__";
    container.style.height = "100%";

    const header = document.createElement("div");
    header.className = "c20-card-header";
    header.textContent = title;
    container.appendChild(header);

    const closeIcon = document.createElement("span");
    closeIcon.textContent = "close";
    closeIcon.className = "ui-icon ui-icon-closethick";

    const closeAnchor = document.createElement("a");
    closeAnchor.href = "#";
    closeAnchor.className = "ui-dialog-titlebar-close ui-corner-all";
    closeAnchor.style.cssText = "top: 15px; right: -15px; position: relative; float: right;";
    closeAnchor.setAttribute("role", "button");
    closeAnchor.appendChild(closeIcon);

    // FIXED: Upgraded to arrow function context mapping to ensure listeners can untether successfully
    closeAnchor.addEventListener("click", (e) => {
      e.preventDefault();
      const parentDialog = this.modal;

      if (closeCallback && parentDialog) {
        closeCallback(parentDialog);
      }

      if (parentDialog) {
        parentDialog.remove();
      }

      // SUCCESS: Perfectly disconnect listeners from global scope to eliminate performance garbage memory leaks
      document.removeEventListener("mousemove", this.boundMouseMove);
      document.removeEventListener("mouseup", this.boundMouseUp);
    });

    header.appendChild(closeAnchor);

    header.addEventListener("mousedown", (e) => {
      if (e.target === closeAnchor || closeAnchor.contains(e.target)) return;

      const parentNode = this.modal.parentNode;
      if (parentNode && parentNode.lastChild !== this.modal) {
        parentNode.appendChild(this.modal);
      }

      this.settings.isDragging = true;
      this.settings.initialX = e.clientX - this.modal.offsetLeft;
      this.settings.initialY = e.clientY - this.modal.offsetTop;
    });

    body.style.fontSize = "16px";
    body.style.height = "calc(100% - 75px)";
    body.style.overflowY = "auto";
    body.style.padding = "10px 20px";

    // FIXED: Removed duplicate header appending layout code that mutated block ordering
    container.appendChild(body);
    this.modal.appendChild(container);

    this.createResizeHandler();
    document.body.appendChild(this.modal);

    // Bind listeners using the cached object tracking handles
    document.addEventListener("mousemove", this.boundMouseMove);
    document.addEventListener("mouseup", this.boundMouseUp);

    // FIXED: Upgraded to type-safe bounding lookups to avoid client rect index crashes
    const bounds = this.modal.getBoundingClientRect();
    let computedHeight = bounds.height + 10;

    if (computedHeight > window.innerHeight) computedHeight = window.innerHeight - 20;
    if (computedHeight > 800) computedHeight = 800;

    this.modal.style.height = `${computedHeight}px`;
    this.modal.style.top = `${(window.innerHeight - computedHeight) / 2}px`;
    this.modal.style.visibility = "visible";
  }

  createResizeHandler() {
    const resizeHandle = document.createElement("div");
    resizeHandle.className =
      "ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se ui-icon-grip-diagonal-se";
    resizeHandle.style.zIndex = "1000";

    resizeHandle.addEventListener("mousedown", (e) => {
      this.settings.isResizing = true;
      this.settings.initialX = e.clientX;
      this.settings.initialY = e.clientY;
      this.settings.initialWidth = this.modal.offsetWidth;
      this.settings.initialHeight = this.modal.offsetHeight;
      e.preventDefault(); // Guard against unintended text highlighting during resize selections
    });

    this.modal.appendChild(resizeHandle);
  }

  mouseMoveDrag(e) {
    if (this.settings.isDragging) {
      const bounds = this.modal.getBoundingClientRect();
      let newLeft = e.clientX - this.settings.initialX;
      let newTop = e.clientY - this.settings.initialY;

      if (newLeft < 0) newLeft = 0;
      if (newLeft + bounds.width > window.innerWidth) newLeft = window.innerWidth - bounds.width;
      if (newTop + bounds.height > window.innerHeight) newTop = window.innerHeight - bounds.height;
      if (newTop < 0) newTop = 0;

      this.modal.style.left = `${newLeft}px`;
      this.modal.style.top = `${newTop}px`;
    } else if (this.settings.isResizing) {
      this.modal.style.width = `${this.settings.initialWidth + (e.clientX - this.settings.initialX)}px`;
      this.modal.style.height = `${this.settings.initialHeight + (e.clientY - this.settings.initialY)}px`;
    }
  }

  mouseUpDrag() {
    this.settings.isDragging = false;
    this.settings.isResizing = false;
  }
}
