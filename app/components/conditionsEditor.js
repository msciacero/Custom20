var ConditionsEditor = (function () {
  var storageKey = "global-conditions";
  var conditionsData = {};
  var settings = {
    gameIndex: "",
    conditionIndex: "",
    orgText: "",
  };

  // modal UI
  function createConditionsModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-settings-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-conditions-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Conditions Editor";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    var conditionContent = document.createElement("div");
    conditionContent.id = "c20-conditions-modal-content";
    conditionContent.style.marginLeft = "15px";
    conditionContent.style.marginTop = "10px";

    var selectWrapper = document.createElement("div");
    selectWrapper.style.display = "flex";
    selectWrapper.style.gap = "20px";

    selectWrapper.appendChild(createGameInput());
    selectWrapper.appendChild(createConditionsInput());

    conditionContent.appendChild(selectWrapper);
    conditionContent.appendChild(createTextInput());
    conditionContent.appendChild(createErrorWrapper());
    conditionContent.appendChild(createDeleteButton());
    conditionContent.appendChild(createSaveButton());

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(conditionContent);
    modal.appendChild(modalContent);

    modalClose.onclick = function () {
      modal.remove();
    };

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  function createGameInput() {
    var gameSelect = createSelectInput({
      name: "game",
      title: "Game",
      options: conditionsData.map((x, i) => ({ name: x.name, value: i })),
    });

    gameSelect.addEventListener("change", function (event) {
      settings.gameIndex = event.target.value;

      document.getElementById("condition-error-wrapper").replaceChildren();
      updateConditionsInput();

      var conditionTextArea = document.getElementById("condition-textarea");
      conditionTextArea.value = "";
    });
    return gameSelect;
  }

  function createConditionsInput() {
    var conditionsSelect = createSelectInput({
      name: "condition",
      title: "Condition",
      options: [],
    });

    conditionsSelect.addEventListener("change", function (event) {
      settings.conditionIndex = event.target.value;
      document.getElementById("condition-error-wrapper").replaceChildren();

      updateButtons(false);
      if (settings.gameIndex === "" || settings.conditionIndex === "") return;

      var selectedCondition;
      if (settings.conditionIndex === "-1") {
        selectedCondition = {
          groupName: "",
          name: "NewCondition",
          desc: ["Description bullet point 1", "Description bullet point 2"],
          short: ["Short description 1", "Short description 2"],
        };
      } else {
        selectedCondition = conditionsData[Number(settings.gameIndex)].items[Number(settings.conditionIndex)];
        var deleteBtn = document.getElementById("delete-condition-button");
        deleteBtn.disabled = false;
      }

      var conditionTextArea = document.getElementById("condition-textarea");
      if (selectedCondition) {
        settings.orgText = JSON.stringify(selectedCondition, null, 2);
        conditionTextArea.value = settings.orgText;
      } else {
        conditionTextArea.value = "";
      }
    });

    return conditionsSelect;
  }

  function updateConditionsInput() {
    settings.conditionIndex = "";
    var conditionSelect = document.getElementById("condition");
    // clear existing options
    conditionSelect.querySelectorAll("option:not(:first-child)").forEach((o) => o.remove());
    var option = document.createElement("option");
    option.value = "-1";
    option.textContent = "-- New Item --";
    option.style.fontStyle = "";
    conditionSelect.appendChild(option);

    if (settings.gameIndex !== "") {
      conditionsData[Number(settings.gameIndex)].items.forEach((c, i) => {
        var option = document.createElement("option");
        option.value = i;
        option.textContent = c.groupName ? `${c.groupName} ${c.name}` : c.name;
        conditionSelect.appendChild(option);
      });
    }
  }

  function createTextInput() {
    var conditionTextArea = document.createElement("textarea");
    conditionTextArea.id = "condition-textarea";
    conditionTextArea.style.width = "95%";
    conditionTextArea.style.height = "200px";
    conditionTextArea.style.marginTop = "10px";

    conditionTextArea.addEventListener("input", function () {
      if (settings.gameIndex !== "" && settings.conditionIndex !== "" && conditionTextArea.value !== settings.orgText) {
        updateButtons(true);
      }
    });

    return conditionTextArea;
  }

  function createErrorWrapper() {
    var errorWrapper = document.createElement("div");
    errorWrapper.id = "condition-error-wrapper";
    errorWrapper.style.color = "red";
    return errorWrapper;
  }

  function createErrorMessage(message) {
    var errorMessage = document.createElement("p");
    errorMessage.className = "condition-error-message";
    errorMessage.textContent = message;
    return errorMessage;
  }

  function createSaveButton() {
    var saveButton = document.createElement("button");
    saveButton.id = "save-condition-button";
    saveButton.textContent = "Save Condition";
    saveButton.className = "btn";
    saveButton.style.marginLeft = "10px";
    saveButton.disabled = true;

    saveButton.addEventListener("click", function () {
      var errorWrapper = document.getElementById("condition-error-wrapper");
      var conditionTextArea = document.getElementById("condition-textarea");
      var conditionUpdate;

      // validate condition data
      var errors = [];
      try {
        conditionUpdate = JSON.parse(conditionTextArea.value);
      } catch (e) {
        errors.push(createErrorMessage("Invalid JSON format. Please correct and try again."));
        errorWrapper.replaceChildren(...errors);
        return;
      }

      if (conditionUpdate.groupName && typeof conditionUpdate.groupName !== "string")
        errors.push(createErrorMessage("The 'groupName' property must be a string."));

      if (!conditionUpdate.name) errors.push(createErrorMessage("Missing property 'name'"));
      else if (typeof conditionUpdate.name !== "string")
        errors.push(createErrorMessage("The 'name' property must be a string."));
      else if (conditionUpdate.name.trim() === "")
        errors.push(createErrorMessage("The 'name' property cannot be empty."));
      else if (
        conditionsData[Number(settings.gameIndex)].items.find(
          (c, i) =>
            c.name === conditionUpdate.name &&
            c?.groupName === conditionUpdate?.groupName &&
            i.toString() !== settings.conditionIndex
        )
      )
        errors.push(createErrorMessage("A condition with the same 'name' and 'groupName' already exists."));

      if (conditionUpdate.desc && !Array.isArray(conditionUpdate.desc))
        errors.push(createErrorMessage("The 'desc' property must be an array of strings."));
      else if (conditionUpdate.desc) {
        conditionUpdate.desc.forEach((d, i) => {
          if (typeof d !== "string")
            errors.push(createErrorMessage(`The 'desc' property at index ${i} must be a string.`));
        });
      }

      if (conditionUpdate.short && !Array.isArray(conditionUpdate.short))
        errors.push(createErrorMessage("The 'short' property must be an array of strings."));
      else if (conditionUpdate.short) {
        conditionUpdate.short.forEach((d, i) => {
          if (typeof d !== "string")
            errors.push(createErrorMessage(`The 'short' property at index ${i} must be a string.`));
        });
      }

      errorWrapper.replaceChildren(...errors);
      if (errors.length > 0) return;

      // save condition data
      if (settings.conditionIndex !== "-1")
        conditionsData[Number(settings.gameIndex)].items[Number(settings.conditionIndex)] = conditionUpdate;
      else conditionsData[Number(settings.gameIndex)].items.push(conditionUpdate);

      chrome.storage.local.set({ [storageKey]: JSON.stringify(conditionsData) });
      updateButtons(false);
      updateConditionsInput();
    });

    return saveButton;
  }

  function createDeleteButton() {
    var deleteButton = document.createElement("button");
    deleteButton.id = "delete-condition-button";
    deleteButton.textContent = "Delete Condition";
    deleteButton.className = "btn";
    deleteButton.disabled = true;

    deleteButton.addEventListener("click", function () {});
    return deleteButton;
  }

  function updateButtons(enable) {
    var deleteBtn = document.getElementById("delete-condition-button");
    var saveBtn = document.getElementById("save-condition-button");

    if (enable) {
      saveBtn.disabled = false;
      saveBtn.classList.add("btn-primary");
    } else {
      deleteBtn.disabled = true;
      saveBtn.disabled = true;
      saveBtn.classList.remove("btn-primary");
    }
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

  var ConditionsEditor = {
    show: async function show() {
      var storedData = await chrome.storage.local.get([storageKey]);
      conditionsData = JSON.parse(storedData[storageKey]);

      createConditionsModal();
    },
  };

  return ConditionsEditor;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return ConditionsEditor;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = ConditionsEditor;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("ConditionsEditor", []).factory("ConditionsEditor", function () {
    return ConditionsEditor;
  });
}
