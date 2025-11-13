var DataReset = (function () {
  var settings = {
    selected: "",
  };

  var resetOptions = [];

  function setResetOptions() {
    resetOptions = [
      {
        name: "Game - Journal",
        value: window.campaign_id + "-journal",
        desc: "Deletes custom journal layout for this game. Requires refresh.",
      },
      {
        name: "Global - Conditions",
        value: "global-conditions",
        desc: "Deletes any changes you have made to the conditions. This includes any custom game lists.",
      },
    ];
  }

  // modal UI
  function createResetModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-settings-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-reset-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Data Reset";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    var resetContent = document.createElement("div");
    resetContent.id = "c20-reset-modal-content";
    resetContent.style.marginLeft = "15px";
    resetContent.style.marginTop = "10px";

    var selectWrapper = document.createElement("div");
    selectWrapper.style.display = "flex";
    selectWrapper.style.gap = "20px";

    selectWrapper.appendChild(createResetInput());

    resetContent.appendChild(selectWrapper);
    resetContent.appendChild(createMessageWrapper());
    resetContent.appendChild(createDeleteButton());

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(resetContent);
    modal.appendChild(modalContent);

    modalClose.onclick = function () {
      modal.remove();
    };

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  function createResetInput() {
    var resetSelect = createSelectInput({
      name: "Data",
      title: "Data",
      options: resetOptions,
    });

    resetSelect.addEventListener("change", function (event) {
      settings.selected = event.target.value;

      var deleteBtn = document.getElementById("delete-data-button");
      var resetWrapper = document.getElementById("data-reset-wrapper");
      resetWrapper.replaceChildren();

      if (settings.selected !== "") {
        resetWrapper.appendChild(createMessage(resetOptions.find((x) => x.value === settings.selected).desc));
        deleteBtn.disabled = false;
        deleteBtn.classList.add("btn-danger");
      } else {
        deleteBtn.disabled = true;
        deleteBtn.classList.remove("btn-danger");
      }
    });
    return resetSelect;
  }

  function createMessageWrapper() {
    var errorWrapper = document.createElement("div");
    errorWrapper.id = "data-reset-wrapper";
    return errorWrapper;
  }

  function createMessage(message) {
    var resetMessage = document.createElement("p");
    resetMessage.textContent = message;
    return resetMessage;
  }

  function createDeleteButton() {
    var deleteButton = document.createElement("button");
    deleteButton.id = "delete-data-button";
    deleteButton.textContent = "Delete Data";
    deleteButton.className = "btn";
    deleteButton.disabled = true;

    deleteButton.addEventListener("click", async function () {
      await chrome.storage.local.remove([resetOptions.find((x) => x.value === settings.selected).value]);

      var deleteBtn = document.getElementById("delete-data-button");
      deleteBtn.disabled = true;
      deleteBtn.classList.remove("btn-danger");
    });
    return deleteButton;
  }

  function createSelectInput(data) {
    var group = document.createElement("div");

    var label = document.createElement("label");
    label.setAttribute("for", data.name);
    label.textContent = data.title;

    var select = document.createElement("select");
    select.id = data.name;
    select.name = data.name;

    // default option
    var option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Select --";
    option.style.fontStyle = "italic";
    select.appendChild(option);

    data.options.forEach((o) => {
      var option = document.createElement("option");
      option.value = o.value;
      option.textContent = o.name;
      select.appendChild(option);
    });

    group.appendChild(label);
    group.appendChild(select);

    return group;
  }

  var DataReset = {
    show: async function show() {
      setResetOptions();
      createResetModal();
    },
  };

  return DataReset;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return DataReset;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = DataReset;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("DataReset", []).factory("DataReset", function () {
    return DataReset;
  });
}
