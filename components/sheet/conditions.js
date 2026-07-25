var Conditions = (function () {
  let storageKey;

  const settings = {
    conditions: null,
    playerConditions: [],
  };

  function createUi() {
    // Prevent duplicated panel injection if init fires multi-times
    if (document.querySelector(".conditions")) return;

    const container = document.createElement("div");
    container.className = "conditions";

    const input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = "attr_options-flag-conditions";

    const inputDisplay = document.createElement("span");
    inputDisplay.textContent = "y";

    const display = createDisplay();
    const options = createOptions();

    container.appendChild(input);
    container.appendChild(inputDisplay);
    container.appendChild(display);
    container.appendChild(options);

    const anchorPoint = document.querySelector(".vitals");
    if (anchorPoint) {
      anchorPoint.after(container);
    } else {
      console.warn("[C20] Aborting condition mount: '.vitals' anchor missing from sheet DOM.");
      return;
    }

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
    const options = document.createElement("div");
    options.style.display = "none";
    options.className = "options";

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "c20-checkbox-container";

    if (!settings.conditions) return options;

    // Filter out and handle individual standalone conditions
    settings.conditions.forEach((condition) => {
      const key = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;

      if (!condition.groupName) {
        const group = document.createElement("div");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `c20-conditions-${key}`;
        input.id = `c20-conditions-${key}`;
        input.checked = settings.playerConditions.includes(key);

        const label = document.createElement("label");
        label.textContent = condition.name;
        label.setAttribute("for", `c20-conditions-${key}`);
        label.className = "c20-label";

        input.addEventListener("change", async function () {
          await updatePlayerConditions(null, key, this.checked);
          updateDisplay();
          updateEffectLabels();
        });

        group.appendChild(input);
        group.appendChild(label);
        checkboxContainer.appendChild(group);
      }
    });

    const groupContainer = document.createElement("div");
    groupContainer.className = "c20-condition-group";

    const filteredConditions = settings.conditions.filter((i) => i.groupName);
    const groups = filteredConditions.reduce((acc, item) => {
      if (!acc[item.groupName]) acc[item.groupName] = [];
      acc[item.groupName].push(item);
      return acc;
    }, {});

    Object.keys(groups).forEach((key) => {
      const radioContainer = document.createElement("div");
      radioContainer.className = `c20-${key} c20-radio-container`;
      radioContainer.style.display = "flex";
      radioContainer.style.fontSize = "9px";
      radioContainer.style.fontWeight = "700";

      const title = document.createElement("div");
      title.textContent = `${key}: `;
      title.style.margin = "2px 5px 0 0";
      radioContainer.appendChild(title);

      groups[key].forEach((condition) => {
        const input = document.createElement("input");
        const groupKey = `${condition.groupName}-${condition.name}`;

        input.type = "radio";
        input.name = `condition-${condition.groupName}`;
        input.id = `c20-conditions-${groupKey}`;

        const isCurrentlyActive = settings.playerConditions.includes(groupKey);
        input.checked = isCurrentlyActive;

        const label = document.createElement("label");
        label.setAttribute("for", `c20-conditions-${groupKey}`);
        label.textContent = condition.name;

        input.addEventListener("click", async function (event) {
          const wasActiveBeforeClick = settings.playerConditions.includes(groupKey);

          if (wasActiveBeforeClick) {
            // If they clicked an already active tier radio button, uncheck it completely
            this.checked = false;
            await updatePlayerConditions(condition.groupName, groupKey, false);
          } else {
            await updatePlayerConditions(condition.groupName, groupKey, true);
          }

          updateDisplay();
          updateEffectLabels();
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
    const display = document.createElement("div");
    display.className = "c20-display";

    const displayList = document.createElement("div");
    displayList.className = "c20-display-list";

    const hr = document.createElement("hr");

    const effectsList = document.createElement("div");
    effectsList.className = "c20-effects-list";

    const label = document.createElement("span");
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
    if (!condition) return document.createElement("div");

    const key = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;

    const conditionLabel = document.createElement("div");
    conditionLabel.className = `c20-conditions-${key}`;
    conditionLabel.textContent = condition.groupName ? `${condition.groupName} ${condition.name}` : key;
    conditionLabel.style.display = "list-item";
    conditionLabel.style.cursor = "pointer";

    conditionLabel.addEventListener("click", async function () {
      const compendiumCondition = await getCompendiumItem(condition.key);
      if (!compendiumCondition) return;

      const title = condition.groupName ? condition.groupName : condition.name;
      const container = document.createElement("div");
      const description = document.createElement("div");

      description.appendChild(createMarkdownDisplay(compendiumCondition.description || "No description provided."));
      container.appendChild(description);

      new CardModal(title, container);
    });

    return conditionLabel;
  }

  async function updateConditionsList() {
    const targetSettings =
      typeof CharacterSettings.settings === "function" ? CharacterSettings.settings() : CharacterSettings.settings;
    settings.compendium = targetSettings?.conditionCompendium || "off";
    if (settings.compendium === "off") return;

    const conditions = await loadCompendiumConditions(settings.compendium);
    if (!conditions) return;

    settings.conditions = conditions
      .sort((a, b) => {
        const nameA = a.groupName ? `${a.groupName}-${a.name}` : a.name;
        const nameB = b.groupName ? `${b.groupName}-${b.name}` : b.name;
        return nameA.localeCompare(nameB);
      })
      .map((x) => ({ key: x.id, name: x.name, groupName: x.groupName }));
  }

  async function updatePlayerConditions(groupName, key, isChecked) {
    const isActive = settings.playerConditions.includes(key);

    if (!isActive && isChecked) {
      settings.playerConditions.push(key);
    } else if (isActive && !isChecked) {
      const index = settings.playerConditions.indexOf(key);
      if (index !== -1) settings.playerConditions.splice(index, 1);
    }

    // Cleanly flush sibling radio tracks out of the pool
    if (groupName && isChecked) {
      settings.conditions
        .filter((condition) => condition.groupName === groupName)
        .forEach((condition) => {
          const groupKey = `${condition.groupName}-${condition.name}`;
          if (groupKey !== key) {
            const index = settings.playerConditions.indexOf(groupKey);
            if (index !== -1) {
              settings.playerConditions.splice(index, 1);
            }
          }
        });
    }

    await saveCharacterConditions();
  }

  function updateDisplay() {
    const displayList = document.querySelector(".c20-display .c20-display-list");
    const hr = document.querySelector(".c20-display hr");
    if (!displayList || !hr) return;

    displayList.replaceChildren();

    if (settings.playerConditions.length === 0) {
      const conditionLabel = document.createElement("div");
      conditionLabel.className = `c20-conditions-none`;
      conditionLabel.textContent = "None";
      conditionLabel.style.display = "list-item";
      displayList.appendChild(conditionLabel);
      hr.style.display = "none";
    } else {
      hr.style.display = "block";
      settings.playerConditions.forEach((key) => {
        if (!settings.conditions) return;

        const condition = settings.conditions.find((c) => {
          const conditionKey = c.groupName ? `${c.groupName}-${c.name}` : c.name;
          return conditionKey === key;
        });

        if (condition) {
          displayList.appendChild(createConditionLabel(condition));
        }
      });
    }
  }

  async function updateEffectLabels() {
    const enabledEffects = [];
    if (!settings.conditions || settings.playerConditions.length === 0) {
      document.querySelector(".c20-effects-list")?.replaceChildren();
      return;
    }

    try {
      // Swapped out sequential await loops for lightning-fast concurrent parallel queries
      const queryPromises = settings.playerConditions.map(async (playerCondKey) => {
        const condition = settings.conditions.find((c) => {
          const conditionKey = c.groupName ? `${c.groupName}-${c.name}` : c.name;
          return conditionKey === playerCondKey;
        });

        if (!condition || !condition.key) return [];
        const compendiumCondition = await getCompendiumItem(condition.key);
        return compendiumCondition?.short || [];
      });

      const resolvedEffectsArrays = await Promise.all(queryPromises);

      // Flatten all collected tags down into a single array track cleanly
      resolvedEffectsArrays.forEach((effects) => {
        enabledEffects.push(...effects);
      });
    } catch (error) {
      console.error("[C20] Failed evaluating active condition effect labels:", error);
    }

    const uniqueSortedEffects = [...new Set(enabledEffects)].sort();
    const holder = [];

    uniqueSortedEffects.forEach((effect) => {
      const label = document.createElement("div");
      label.textContent = effect;
      label.style.display = "list-item";
      holder.push(label);
    });

    const effectsListContainer = document.querySelector(".c20-effects-list");
    if (effectsListContainer) {
      effectsListContainer.replaceChildren(...holder);
    }
  }

  async function saveCharacterConditions() {
    await StorageHelper.addOrUpdateItem(
      StorageHelper.dbNames.characters,
      window.character_id,
      settings.playerConditions,
      "conditions",
    );
  }

  async function loadCharacterConditions() {
    return await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "conditions");
  }

  async function loadCompendiumConditions() {
    return await StorageHelper.listItemsByType(StorageHelper.dbNames.compendiums, settings.compendium, "condition");
  }

  async function getCompendiumItem(itemKey) {
    return await StorageHelper.getItem(StorageHelper.dbNames.compendiums, settings.compendium, itemKey);
  }

  const Conditions = {
    init: async function init() {
      document.querySelector(".conditions")?.remove();
      await updateConditionsList();
      if (settings.compendium === "off") return;

      // Pull down existing tracking array from local storage
      const storedConditions = await loadCharacterConditions();
      settings.playerConditions = Array.isArray(storedConditions) ? storedConditions : [];

      // Clean filter bounds check validation
      if (Array.isArray(settings.conditions)) {
        settings.playerConditions = settings.playerConditions.filter((key) =>
          settings.conditions.some((condition) => {
            const conditionKey = condition.groupName ? `${condition.groupName}-${condition.name}` : condition.name;
            return conditionKey === key;
          }),
        );
      }

      createUi();
      await updateEffectLabels();
    },
    remove: function remove() {
      document.querySelector(".conditions")?.remove();
    },
  };

  return Conditions;
})();
