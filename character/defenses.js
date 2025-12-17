//--Adds defenses and conditions to character sheet--

var Defenses = (function () {
  var storageKey;

  var defenses = {
    resistance: "",
    immunity: "",
    vulnerability: "",
  };

  function createInput(defenseType) {
    var row = document.createElement("div");
    row.className = `row c20-health-${defenseType}`;

    var label = document.createElement("img");
    label.src = chrome.runtime.getURL(`library/icons/resistance.svg`);
    label.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    var labelText = document.createElement("span");
    labelText.className = "c20-imageText";
    labelText.textContent = defenseType.charAt(0).toUpperCase();
    labelText.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    var input = document.createElement("input");
    input.type = "text";
    input.name = `attr_class_defense_${defenseType}`;
    input.value = defenses[defenseType];
    input.placeholder = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    input.addEventListener("change", async function (event) {
      document.querySelector(`.health-defense .c20-health-${defenseType} .c20-defenseText`).textContent =
        event.target.value;
      defenses[defenseType] = event.target.value;
      await saveDefenses();
    });

    row.appendChild(label);
    row.appendChild(labelText);
    row.appendChild(input);

    return row;
  }

  function createDisplay(defenseType) {
    var row = document.createElement("div");
    row.className = `row c20-health-${defenseType}`;

    var label = document.createElement("img");
    label.src = chrome.runtime.getURL(`library/icons/resistance.svg`);
    label.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    var labelText = document.createElement("span");
    labelText.className = "c20-imageText";
    labelText.textContent = defenseType.charAt(0).toUpperCase();
    labelText.title = defenseType.charAt(0).toUpperCase() + defenseType.slice(1);

    var display = document.createElement("span");
    display.name = `attr_class_defense_${defenseType}`;
    display.className = "c20-defenseText";
    display.textContent = defenses[defenseType];
    display.style.display = "inline";
    display.style.width = "initial";

    row.appendChild(label);
    row.appendChild(labelText);
    row.appendChild(display);

    return row;
  }

  function createUi() {
    var div = document.createElement("div");
    div.className = "health-defense";

    var input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = "attr_options-flag-defenses";

    var inputDisplay = document.createElement("span");
    inputDisplay.style.top = "-10px";
    inputDisplay.textContent = "y";

    var display = document.createElement("div");
    display.className = "display";
    display.appendChild(createDisplay("resistance"));
    display.appendChild(createDisplay("immunity"));
    display.appendChild(createDisplay("vulnerability"));

    var options = document.createElement("div");
    options.className = "options";
    options.style.display = "none";
    options.appendChild(createInput("resistance"));
    options.appendChild(createInput("immunity"));
    options.appendChild(createInput("vulnerability"));

    div.appendChild(input);
    div.appendChild(inputDisplay);
    div.appendChild(display);
    div.appendChild(options);

    document.querySelector(".hp").before(div);

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

  //save
  async function saveDefenses() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, defenses, "defenses");
  }

  //load
  async function loadDefenses() {
    var storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "defenses");
    if (storedData !== undefined) {
      defenses = storedData;
      return;
    }

    storedData = await chrome.storage.local.get([storageKey]);
    if (storedData[storageKey] === undefined) return;

    defenses = JSON.parse(storedData[storageKey]);
    saveDefenses();
  }

  var Defenses = {
    init: async function init() {
      storageKey = window.character_id + "-defenses";
      await loadDefenses();
      createUi();
    },
    remove: function remove() {
      document.querySelector(".health-defense").remove();
    },
  };
  return Defenses;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Defenses;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Defenses;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Defenses", []).factory("Defenses", function () {
    return Defenses;
  });
}
