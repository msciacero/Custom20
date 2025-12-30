var SavedData = (function () {
  async function createModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-data-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.maxWidth = "850px";

    modalContent.appendChild(createModalHeader());
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  function createModalHeader() {
    var modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    var modalTitle = document.createElement("h3");
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Data Editor";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    modalClose.onclick = function () {
      document.querySelector("#c20-data-modal").remove();
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);

    return modalHeader;
  }

  var SavedData = {
    show: async function show() {
      await createModal();
    },
  };

  return SavedData;
})();
