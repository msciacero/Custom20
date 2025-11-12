var Conditions = (function () {
  var storageKey;
  var settings = {
    game: "DnD2014",
    conditions: null,
    playerConditions: [],
  };

  function createUi() {
    var container = document.createElement("div");
    container.className = "conditions";

    var input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = "attr_options-flag-conditions";

    var inputDisplay = document.createElement("span");
    inputDisplay.textContent = "y";

    var display = createDisplay();
    var options = createOptions();
    var modal = createDisplayModal();

    container.appendChild(input);
    container.appendChild(inputDisplay);
    container.appendChild(display);
    container.appendChild(options);
    document.querySelector(".vitals").after(container);
    document.querySelector("body").appendChild(modal);

    updateDisplay();
    updateEffectLabels();

    input.addEventListener("change", function (event) {
      if (event.target.checked) {
        display.style.display = "none";
        options.style.display = "block";
      } else {
        display.style.display = "block";
        options.style.display = "none";
      }
    });
  }

  function createOptions() {
    var options = document.createElement("div");
    options.style.display = "none";
    options.className = "options";

    // individual settings
    var checkboxContainer = document.createElement("div");
    checkboxContainer.className = "c20-checkbox-container";

    settings.conditions.forEach((condition) => {
      var key = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;

      if (!condition.groupName) {
        var group = document.createElement("div");

        var input = document.createElement("input");
        input.type = "checkbox";
        input.name = `c20-conditions-${key}`;
        input.id = `c20-conditions-${key}`;
        input.checked = settings.playerConditions.includes(key);

        var label = document.createElement("label");
        label.textContent = condition.name;
        label.setAttribute("for", `c20-conditions-${key}`);
        label.className = "c20-label";

        input.addEventListener("change", function (event) {
          updatePlayerConditions(null, key, this.checked);
          updateDisplay();
          updateEffectLabels();
        });

        group.appendChild(input);
        group.appendChild(label);
        checkboxContainer.appendChild(group);
      }
    });

    // group settings
    var groupContainer = document.createElement("div");
    groupContainer.className = "c20-condition-group";

    var groups = Object.groupBy(
      settings.conditions.filter((i) => i.groupName),
      ({ groupName }) => groupName
    );

    Object.keys(groups).forEach((key) => {
      var radioContainer = document.createElement("div");
      radioContainer.className = `c20-${key} c20-radio-container`;
      radioContainer.style.display = "flex";
      radioContainer.style.fontSize = "9px";
      radioContainer.style.fontWeight = 700;

      var title = document.createElement("div");
      title.textContent = `${key}: `;
      title.style.margin = "2px 5px 0 0";
      radioContainer.appendChild(title);

      groups[key].forEach((condition) => {
        var input = document.createElement("input");
        var groupKey = `${condition.groupName}-${condition.name}`;

        input.type = "radio";
        input.name = `condition-${condition.groupName}`;
        input.id = `c20-conditions-${groupKey}`;
        input.checked = settings.playerConditions.includes(`${groupKey}`);

        var label = document.createElement("label");
        label.setAttribute("for", `c20-conditions-${groupKey}`);
        label.textContent = condition.name;

        input.addEventListener("click", function (event) {
          if (settings.playerConditions.includes(`${groupKey}`)) {
            this.checked = false;
          }

          updatePlayerConditions(condition.groupName, groupKey, this.checked);
          updateDisplay();

          updateEffectLabels();
          saveConditions();
        });

        radioContainer.appendChild(input);
        radioContainer.appendChild(label);
        groupContainer.appendChild(radioContainer);
      });
    });

    options.appendChild(checkboxContainer);
    options.appendChild(groupContainer);

    return options;
  }

  function createDisplay() {
    var display = document.createElement("div");
    display.className = "c20-display";

    // condition labels
    var displayList = document.createElement("div");
    displayList.className = "c20-display-list";

    // horizontal rule
    var hr = document.createElement("hr");

    // effects labels
    var effectsList = document.createElement("div");
    effectsList.className = "c20-effects-list";

    // panel label
    var label = document.createElement("span");
    label.className = "label";
    label.setAttribute("data-i18n", "conditions");
    label.textContent = "CONDITIONS";

    display.appendChild(displayList);
    display.appendChild(hr);
    display.appendChild(effectsList);
    display.appendChild(label);

    return display;
  }

  function createConditionLabel(condition) {
    var key = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;

    var conditionLabel = document.createElement("div");
    conditionLabel.className = `c20-conditions-${key}`;
    if (condition.groupName) conditionLabel.textContent = `${condition.groupName} ${condition.name}`;
    else conditionLabel.textContent = key;
    conditionLabel.style.display = "list-item";
    conditionLabel.style.cursor = "pointer";

    conditionLabel.addEventListener("click", function () {
      var modal = document.querySelector("#c20-conditions-modal");
      var title = modal.querySelector("#c20-conditions-modal-title");
      title.textContent = condition.groupName ? `${condition.groupName} ${condition.name}` : condition.name;

      var content = modal.querySelector("#c20-conditions-modal-content");
      content.replaceChildren();

      condition.desc.forEach((desc) => {
        var item = document.createElement("div");
        item.style.display = "list-item";
        item.textContent = desc;
        content.appendChild(item);
      });

      modal.style.display = "block";
    });

    return conditionLabel;
  }

  function createDisplayModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-conditions-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-conditions-modal-title";
    modalTitle.style.display = "inline-block";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    var conditionContent = document.createElement("div");
    conditionContent.id = "c20-conditions-modal-content";
    conditionContent.style.marginLeft = "15px";

    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalClose);
    modalContent.appendChild(conditionContent);
    modal.appendChild(modalContent);

    modalClose.onclick = function () {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    return modal;
  }

  function updatePlayerConditions(groupName, key, isChecked) {
    const isActive = settings.playerConditions.includes(key);
    if (!isActive && isChecked) {
      settings.playerConditions.push(key);
    } else if (isActive && !isChecked) {
      settings.playerConditions.splice(settings.playerConditions.indexOf(key), 1);
    }

    // remove other conditions in the same group
    if (groupName) {
      settings.conditions
        .filter((condition) => condition.groupName === groupName)
        .forEach((condition) => {
          var groupKey = `${condition.groupName}-${condition.name}`;
          if (groupKey !== key) {
            var index = settings.playerConditions.indexOf(groupKey);
            if (index !== -1) {
              settings.playerConditions.splice(index, 1);
            }
          }
        });
    }

    chrome.storage.local.set({ [storageKey]: JSON.stringify(settings.playerConditions) });
  }

  function updateDisplay() {
    var displayList = document.querySelector(".c20-display .c20-display-list");
    var hr = document.querySelector(".c20-display hr");
    displayList.replaceChildren();

    if (settings.playerConditions.length === 0) {
      var conditionLabel = document.createElement("div");
      conditionLabel.className = `c20-conditions-none`;
      conditionLabel.textContent = "None";
      conditionLabel.style.display = "list-item";
      displayList.appendChild(conditionLabel);
      hr.style.display = "none";
    } else {
      hr.style.display = "block";
      settings.playerConditions.forEach((key) => {
        var condition = settings.conditions.find((condition) => {
          var conditionKey = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;
          return conditionKey === key;
        });
        displayList.appendChild(createConditionLabel(condition));
      });
    }
  }

  function updateEffectLabels() {
    var enabledEffects = [];

    settings.playerConditions.forEach((key) => {
      var condition = settings.conditions.find((condition) => {
        var conditionKey = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;
        return conditionKey === key;
      });
      enabledEffects.push(...condition.short);
    });

    enabledEffects = enabledEffects.sort();
    enabledEffects = [...new Set(enabledEffects)];

    var holder = [];

    // display enabled effects
    enabledEffects.forEach((effect) => {
      var label = document.createElement("div");
      label.textContent = effect;
      label.style.display = "list-item";
      holder.push(label);
    });

    document.querySelector(".c20-effects-list").replaceChildren(...holder);
  }

  //save
  function saveConditions() {}

  //load
  async function loadConditions(key) {
    var storedData = await chrome.storage.local.get([key]);
    if (storedData[key] === undefined) return;

    return JSON.parse(storedData[key]);
  }

  var Conditions = {
    init: async function init() {
      storageKey = window.character_id + "-conditions";

      // get condition list
      settings.conditions = await loadConditions("global-conditions");
      settings.conditions = settings.conditions
        .find((x) => x.name === settings.game)
        .items.sort((a, b) => {
          var nameA = a.groupName ? `${a.groupName}-${a.name}` : a.name;
          var nameB = b.groupName ? `${b.groupName}-${b.name}` : b.name;
          return nameA.localeCompare(nameB);
        });

      // get existing player conditions
      settings.playerConditions = (await loadConditions(storageKey)) ?? [];

      // remove any existing player conditions that are no longer in conditions list
      settings.playerConditions = settings.playerConditions.filter((key) =>
        settings.conditions.some((condition) => {
          var conditionKey = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;
          return conditionKey === key;
        })
      );

      createUi();
      updateEffectLabels();
    },
  };
  return Conditions;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Conditions;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Conditions;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Conditions", []).factory("Conditions", function () {
    return Conditions;
  });
}
