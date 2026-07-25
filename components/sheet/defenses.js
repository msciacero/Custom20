var Defenses = (function () {
  let storageKey;

  // Serves purely as the initial default schema structure
  const defaultDefenses = {
    resistance: "",
    immunity: "",
    vulnerability: "",
  };

  function createInput(defenseType, initialValue) {
    const row = document.createElement("div");
    row.className = `row c20-health-${defenseType}`;

    const label = document.createElement("img");
    label.src = browser.runtime.getURL(`library/icons/resistance.svg`);
    label.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    const labelText = document.createElement("span");
    labelText.className = "c20-imageText";
    labelText.textContent = defenseType.charAt(0).toUpperCase();
    labelText.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    const input = document.createElement("input");
    input.type = "text";
    input.name = `attr_class_defense_${defenseType}`;
    input.value = initialValue;
    input.placeholder = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    input.addEventListener("change", async function (event) {
      const newValue = event.target.value;

      // Update UI displays immediately
      const textDisplay = document.querySelector(`.health-defense .c20-health-${defenseType} .c20-defenseText`);
      if (textDisplay) textDisplay.textContent = newValue;

      let currentStoredData = await StorageHelper.getItem(
        StorageHelper.dbNames.characters,
        window.character_id,
        "defenses",
      );
      if (!currentStoredData) {
        currentStoredData = { ...defaultDefenses };
      }

      currentStoredData[defenseType] = newValue;

      await StorageHelper.addOrUpdateItem(
        StorageHelper.dbNames.characters,
        window.character_id,
        currentStoredData,
        "defenses",
      );
    });

    row.appendChild(label);
    row.appendChild(labelText);
    row.appendChild(input);

    return row;
  }

  function createDisplay(defenseType, currentValue) {
    const row = document.createElement("div");
    row.className = `row c20-health-${defenseType}`;

    const label = document.createElement("img");
    label.src = browser.runtime.getURL(`library/icons/resistance.svg`);
    label.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    const labelText = document.createElement("span");
    labelText.className = "c20-imageText";
    labelText.textContent = defenseType.charAt(0).toUpperCase();
    labelText.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    const display = document.createElement("span");
    display.name = `attr_class_defense_${defenseType}`;
    display.className = "c20-defenseText";
    display.textContent = currentValue;
    display.style.display = "inline";
    display.style.width = "initial";

    row.appendChild(label);
    row.appendChild(labelText);
    row.appendChild(display);

    return row;
  }

  function createUi(activeData) {
    if (document.querySelector(".health-defense")) return;

    const div = document.createElement("div");
    div.className = "health-defense";

    const input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = "attr_options-flag-defenses";

    const inputDisplay = document.createElement("span");
    inputDisplay.style.top = "-10px";
    inputDisplay.textContent = "y";

    const display = document.createElement("div");
    display.className = "display";
    display.appendChild(createDisplay("resistance", activeData.resistance));
    display.appendChild(createDisplay("immunity", activeData.immunity));
    display.appendChild(createDisplay("vulnerability", activeData.vulnerability));

    const options = document.createElement("div");
    options.className = "options";
    options.style.display = "none";
    options.appendChild(createInput("resistance", activeData.resistance));
    options.appendChild(createInput("immunity", activeData.immunity));
    options.appendChild(createInput("vulnerability", activeData.vulnerability));

    div.appendChild(input);
    div.appendChild(inputDisplay);
    div.appendChild(display);
    div.appendChild(options);

    const anchorPoint = document.querySelector(".hp");
    if (anchorPoint) {
      anchorPoint.before(div);
    } else {
      console.warn("[C20] Could not find anchor point '.hp' to inject defense layout.");
    }

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

  // load & verify validation routines safely
  async function loadAndRetrieveDefenses() {
    const storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "defenses");

    if (storedData !== undefined) {
      return { ...defaultDefenses, ...storedData };
    }

    // Initialize default structure if empty
    await StorageHelper.addOrUpdateItem(
      StorageHelper.dbNames.characters,
      window.character_id,
      defaultDefenses,
      "defenses",
    );
    return { ...defaultDefenses };
  }

  var Defenses = {
    init: async function init() {
      storageKey = window.character_id + "-defenses";
      const cleanData = await loadAndRetrieveDefenses();
      createUi(cleanData);
    },
    remove: function remove() {
      document.querySelector(".health-defense")?.remove();
    },
  };
  return Defenses;
})();
