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
    selectWrapper.appendChild(createDeleteButton());

    conditionContent.appendChild(selectWrapper);
    conditionContent.appendChild(createHelpDisplay());
    conditionContent.appendChild(createTextInput());
    conditionContent.appendChild(createErrorWrapper());
    conditionContent.appendChild(createSaveButton());

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(createHelpButton());
    modalHeader.appendChild(modalClose);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(conditionContent);
    modal.appendChild(modalContent);

    modalClose.onclick = function () {
      modal.remove();
    };

    document.body.appendChild(modal);
    modal.style.display = "block";
    updateGameInput();
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
        deleteBtn.classList.add("btn-danger");
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
    option.textContent = "-- New Condition --";
    option.style.fontStyle = "";
    conditionSelect.appendChild(option);

    if (settings.gameIndex !== "") {
      conditionsData[Number(settings.gameIndex)].items
        .sort((a, b) => {
          var nameA = a.groupName ? `${a.groupName}-${a.name}` : a.name;
          var nameB = b.groupName ? `${b.groupName}-${b.name}` : b.name;
          return nameA.localeCompare(nameB);
        })
        .forEach((c, i) => {
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
            getGroupname(c?.groupName) === getGroupname(conditionUpdate?.groupName) &&
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
      } else if (!conditionUpdate.desc) {
        errors.push(createErrorMessage(`Missing 'desc' property.`));
      }

      if (conditionUpdate.short && !Array.isArray(conditionUpdate.short))
        errors.push(createErrorMessage("The 'short' property must be an array of strings."));
      else if (conditionUpdate.short) {
        conditionUpdate.short.forEach((d, i) => {
          if (typeof d !== "string")
            errors.push(createErrorMessage(`The 'short' property at index ${i} must be a string.`));
        });
      } else if (!conditionUpdate.short) {
        errors.push(createErrorMessage(`Missing 'short' property.`));
      }

      errorWrapper.replaceChildren(...errors);
      if (errors.length > 0) return;

      // save condition data
      if (conditionUpdate.groupName === "" || conditionUpdate.groupName === null) conditionUpdate.groupName = undefined;

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
    deleteButton.title = "Delete Condition";
    deleteButton.textContent = "#";
    deleteButton.className = "btn";
    deleteButton.disabled = true;

    deleteButton.addEventListener("click", function () {
      conditionsData[Number(settings.gameIndex)].items.splice([Number(settings.conditionIndex)], 1);

      chrome.storage.local.set({ [storageKey]: JSON.stringify(conditionsData) });
      updateButtons(false);
      updateConditionsInput();
    });
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
      deleteBtn.classList.remove("btn-danger");
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

  function createHelpDisplay() {
    var div = document.createElement("div");
    div.style.display = "none";
    div.id = "c20-conditions-editor-help";

    var o1 = document.createElement("ul");
    o1.appendChild(createHelpLi("GroupName: Optional field. Name of condition when condition has levels."));
    o1.appendChild(createHelpLi("Name: Condition name or level."));
    o1.appendChild(createHelpLi("Desc: Descriptions that are displayed in condition dialog."));
    o1.appendChild(createHelpLi("Short: Descriptions that are displayed on character sheet. "));
    div.appendChild(o1);

    return div;
  }

  function createHelpLi(text) {
    var el = document.createElement("li");
    el.textContent = text;
    return el;
  }

  function createHelpButton() {
    var helpButton = document.createElement("span");
    helpButton.style.fontFamily = "pictos";
    helpButton.style.marginLeft = "5px";
    helpButton.style.cursor = "pointer";
    helpButton.style.position = "absolute";
    helpButton.textContent = "?";

    helpButton.addEventListener("click", function () {
      var helpDisplay = document.querySelector("#c20-conditions-editor-help");
      if (helpDisplay.style.display === "block") helpDisplay.style.display = "none";
      else helpDisplay.style.display = "block";
    });

    return helpButton;
  }

  function getGroupname(groupName) {
    if (typeof groupName === "string" && groupName !== "") return groupName;
    return undefined;
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
