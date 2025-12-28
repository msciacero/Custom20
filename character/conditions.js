var Conditions = (function () {
  var storageKey;
  var settings = {
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

    container.appendChild(input);
    container.appendChild(inputDisplay);
    container.appendChild(display);
    container.appendChild(options);
    document.querySelector(".vitals").after(container);

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

        input.addEventListener("change", async function (event) {
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
          saveCharacterConditions();
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

    conditionLabel.addEventListener("click", async function () {
      var compendiumCondition = await getCompendiumItem(condition.key);
      var title = condition.groupName ? condition.groupName : condition.name;
      var container = document.createElement("div");
      var description = document.createElement("div");
      description.appendChild(createMarkdownDisplay(compendiumCondition.description));
      container.appendChild(description);
      new ModalHelper(title, container);
    });

    return conditionLabel;
  }

  async function updateConditionsList() {
    settings.compendium = await getConditionCompendium();
    if (settings.compendium === "off") return;

    var conditions = await loadCompendiumConditions(settings.compendium);
    settings.conditions = conditions
      .sort((a, b) => {
        var nameA = a.groupName ? `${a.groupName}-${a.name}` : a.name;
        var nameB = b.groupName ? `${b.groupName}-${b.name}` : b.name;
        return nameA.localeCompare(nameB);
      })
      .map((x) => ({ key: x.id, name: x.name, groupName: x.groupName }));
  }

  async function updatePlayerConditions(groupName, key, isChecked) {
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

    await saveCharacterConditions();
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

  async function updateEffectLabels() {
    var enabledEffects = [];

    for (var i = 0; i < settings.playerConditions.length; i++) {
      var condition = settings.conditions.find((condition) => {
        var conditionKey = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;
        return conditionKey === settings.playerConditions[i];
      });
      var compendiumCondition = await getCompendiumItem(condition.key);

      enabledEffects.push(...compendiumCondition.short);
    }

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
  async function saveCharacterConditions() {
    await StorageHelper.addOrUpdateItem(
      StorageHelper.dbNames.characters,
      window.character_id,
      settings.playerConditions,
      "conditions"
    );
  }

  //load
  async function loadCharacterConditions() {
    return await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "conditions");
  }

  async function loadCompendiumConditions() {
    return await StorageHelper.listItemsByType(StorageHelper.dbNames.compendiums, settings.compendium, "condition");
  }

  async function getConditionCompendium() {
    var characterSettings = await StorageHelper.getItem(
      StorageHelper.dbNames.characters,
      window.character_id,
      "settings"
    );
    return characterSettings.conditionCompendium;
  }

  async function getCompendiumItem(itemKey) {
    return await StorageHelper.getItem(StorageHelper.dbNames.compendiums, settings.compendium, itemKey);
  }

  var Conditions = {
    init: async function init() {
      document.querySelector(".conditions")?.remove();
      await updateConditionsList();
      if (settings.compendium === "off") return;

      // get existing player conditions
      settings.playerConditions = (await loadCharacterConditions()) ?? [];

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
    remove: function remove() {
      document.querySelector(".conditions")?.remove();
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
