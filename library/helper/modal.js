class ModalHelper {
  constructor(title, body, isCard) {
    this.modal = null;
    this.settings = {
      isDragging: false,
      isResizing: false,
      initialX: 0,
      initialY: 0,
      initialWidth: 0,
      initialHeight: 0,
    };

    if (isCard === true) this.createCardModal(title, body);
    else this.createModal(title, body);
  }

  createModal(title, body) {
    this.modal = document.createElement("div");

    this.modal.className = `ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-resizable`;
    this.modal.style.display = "block";
    if (window.innerWidth > 790) this.modal.style.width = "500px";
    else this.modal.style.width = "calc(100vw - 10px)";
    this.modal.style.left = "50%";
    this.modal.style.top = "50%";
    this.modal.style.transform = "translate(-50%, -50%)";
    this.modal.style.zIndex = "11003";

    var container = document.createElement("div");
    container.style.height = "100%";
    container.appendChild(this.createHeader(title));
    container.appendChild(body);

    this.createResizeHandler();
    this.modal.appendChild(container);
    document.querySelector("body").appendChild(this.modal);

    document.addEventListener("mousemove", (e) => this.mouseMoveDrag(e));
    document.addEventListener("mouseup", () => this.mouseUpDrag());
  }

  createHeader(title) {
    var close = document.createElement("span");
    close.textContent = "close";
    close.className = "ui-icon ui-icon-closethick";

    var closeAnchor = document.createElement("a");
    closeAnchor.href = "#";
    closeAnchor.className = "ui-dialog-titlebar-close ui-corner-all";
    closeAnchor.setAttribute("role", "button");
    closeAnchor.appendChild(close);
    closeAnchor.addEventListener("click", function (e) {
      e.target.closest(".ui-dialog").remove();
      document.removeEventListener("mousemove", this.mouseMoveDrag);
      document.removeEventListener("mousemove", this.mouseUpDrag);
    });

    var header = document.createElement("div");
    header.className = "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix ui-draggable-handle";
    header.appendChild(title);
    header.appendChild(closeAnchor);

    header.addEventListener("mousedown", (e) => {
      if (e.target == closeAnchor || closeAnchor.contains(e.target)) return;
      if (this.modal.parentNode.lastChild !== this.modal) this.modal.parentNode.appendChild(this.modal);
      this.settings.isDragging = true;
      this.settings.initialX = e.clientX - this.modal.offsetLeft;
      this.settings.initialY = e.clientY - this.modal.offsetTop;
    });

    return header;
  }

  createCardModal(title, body) {
    this.modal = document.createElement("div");

    this.modal.className = `ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-resizable c20-modal-card`;
    this.modal.style.display = "block";
    if (window.innerWidth > 790) this.modal.style.width = "500px";
    else this.modal.style.width = "calc(100vw - 10px)";
    this.modal.style.left = "50%";
    this.modal.style.top = "50%";
    this.modal.style.transform = "translate(-50%, -50%)";
    this.modal.style.zIndex = "11003";

    var container = document.createElement("div");
    container.style.height = "100%";
    container.style.overflowY = "auto";

    var header = document.createElement("div");
    header.className = "c20-card-header";
    header.textContent = title;
    container.appendChild(header);

    var close = document.createElement("span");
    close.textContent = "close";
    close.className = "ui-icon ui-icon-closethick";

    var closeAnchor = document.createElement("a");
    closeAnchor.href = "#";
    closeAnchor.className = "ui-dialog-titlebar-close ui-corner-all";
    closeAnchor.style.top = "15px";
    closeAnchor.style.right = "-15px";
    closeAnchor.style.position = "relative";
    closeAnchor.style.float = "right";
    closeAnchor.setAttribute("role", "button");
    closeAnchor.appendChild(close);
    closeAnchor.addEventListener("click", function (e) {
      e.target.closest(".ui-dialog").remove();
      document.removeEventListener("mousemove", this.mouseMoveDrag);
      document.removeEventListener("mousemove", this.mouseUpDrag);
    });
    header.appendChild(closeAnchor);

    header.addEventListener("mousedown", (e) => {
      if (e.target == closeAnchor || closeAnchor.contains(e.target)) return;
      if (this.modal.parentNode.lastChild !== this.modal) this.modal.parentNode.appendChild(this.modal);
      this.settings.isDragging = true;
      this.settings.initialX = e.clientX - this.modal.offsetLeft;
      this.settings.initialY = e.clientY - this.modal.offsetTop;
    });

    container.appendChild(header);
    container.appendChild(body);

    this.modal.appendChild(container);
    this.createResizeHandler();
    document.querySelector("body").appendChild(this.modal);
    document.addEventListener("mousemove", (e) => this.mouseMoveDrag(e));
    document.addEventListener("mouseup", () => this.mouseUpDrag());
  }

  createResizeHandler() {
    var resizeHandle = document.createElement("div");
    resizeHandle.className =
      "ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se ui-icon-grip-diagonal-se";
    resizeHandle.style.zIndex = "1000";
    resizeHandle.addEventListener("mousedown", (e) => {
      this.settings.isResizing = true;
      this.settings.initialX = e.clientX;
      this.settings.initialY = e.clientY;
      this.settings.initialWidth = this.modal.offsetWidth;
      this.settings.initialHeight = this.modal.offsetHeight;
    });

    this.modal.appendChild(resizeHandle);
  }

  mouseMoveDrag(e) {
    if (this.settings.isDragging) {
      this.modal.style.left = e.clientX - this.settings.initialX + "px";
      this.modal.style.top = e.clientY - this.settings.initialY + "px";
    } else if (this.settings.isResizing) {
      this.modal.style.width = this.settings.initialWidth + (e.clientX - this.settings.initialX) + "px";
      this.modal.style.height = this.settings.initialHeight + (e.clientY - this.settings.initialY) + "px";
    }
  }

  mouseUpDrag() {
    this.settings.isDragging = false;
    this.settings.isResizing = false;
  }
}
