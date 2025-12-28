class ModalHelper {
  constructor(title, body) {
    this.modal = null;
    this.settings = {
      isDragging: false,
      isResizing: false,
      initialX: 0,
      initialY: 0,
      initialWidth: 0,
      initialHeight: 0,
    };

    this.createCardModal(title, body);
  }

  createCardModal(title, body) {
    this.modal = document.createElement("div");

    this.modal.className = `ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-resizable c20-modal-card`;
    this.modal.style.display = "block";
    this.modal.style.visibility = "hidden";
    if (window.innerWidth > 790) this.modal.style.width = "500px";
    else this.modal.style.width = "calc(100vw - 50px)";
    this.modal.style.left = `calc((100vw - ${this.modal.style.width}) / 2)`;
    this.modal.style.zIndex = "11003";

    var container = document.createElement("div");
    container.style.height = "100%";

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

    body.style.fontSize = "16px";
    body.style.height = "calc(100% - 75px)";
    body.style.overflowY = "auto";
    body.style.padding = "10px 20px";

    container.appendChild(header);
    container.appendChild(body);

    this.modal.appendChild(container);
    this.createResizeHandler();
    document.querySelector("body").appendChild(this.modal);
    document.addEventListener("mousemove", (e) => this.mouseMoveDrag(e));
    document.addEventListener("mouseup", () => this.mouseUpDrag());

    // set height
    var bounds = this.modal.childNodes[0].childNodes[1].childNodes[0].getBoundingClientRect();
    var height = bounds.height + 115;
    if (height > window.innerHeight) height = window.innerHeight - 20;
    if (height > 800) height = 800;

    this.modal.style.height = height + "px";
    this.modal.style.top = `${(window.innerHeight - height) / 2}px`;
    this.modal.style.visibility = "visible";
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
      var bounds = this.modal.getBoundingClientRect();
      var newLeft = e.clientX - this.settings.initialX;
      var newTop = e.clientY - this.settings.initialY;

      if (newLeft < 0) newLeft = 0;
      if (newLeft + bounds.width > window.innerWidth) newLeft = window.innerWidth - bounds.width;
      if (newTop + bounds.height > window.innerHeight) newTop = window.innerHeight - bounds.height;
      if (newTop < 0) newTop = 0;

      this.modal.style.left = newLeft + "px";
      this.modal.style.top = newTop + "px";
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
