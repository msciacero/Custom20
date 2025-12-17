var CharacterSettings = (function () {
  var settings = {};

  async function createUi() {
    var container = document.createElement("div");
    container.id = "c20-character-settings";

    container.appendChild(createDefensesRow());
    container.appendChild(createSpellFilterRow());
    container.appendChild(createSpellViewRow());
    container.appendChild(await createConditionsRow());
    container.appendChild(createTitleRow());

    document.querySelector(".page.options .general_options").after(container);
  }

  async function createConditionsRow() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    games.sort((a, b) => {
      return a.localeCompare(b);
    });

    if (!games.includes(settings.conditionCompendium)) settings.conditionCompendium = "Off";

    var conditionOptions = games.map((g) => ({ name: g, value: g }));
    conditionOptions.push({ name: "Off", value: "off" });

    var row = document.createElement("div");
    row.className = "row";

    var span = document.createElement("span");
    span.textContent = "CONDITIONS:";
    row.appendChild(span);

    var select = document.createElement("select");
    select.name = "settings-conditions";
    select.value = settings.conditionCompendium;

    conditionOptions.forEach((g) => {
      var option = document.createElement("option");
      option.value = g.value;
      option.textContent = g.name;
      select.appendChild(option);
    });

    select.addEventListener("change", async function (event) {
      settings.conditionCompendium = event.target.value;
      await saveSettings();

      if (settings.conditionCompendium === "off") Conditions.remove();
      else Conditions.init();
    });

    row.appendChild(select);
    return row;
  }

  function createDefensesRow() {
    var row = document.createElement("div");
    row.className = "row";

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "settings-defenses";
    input.checked = settings.defenses;
    row.appendChild(input);

    var span = document.createElement("span");
    span.textContent = "SHOW DEFENSES";
    row.appendChild(span);

    input.addEventListener("change", async function (event) {
      settings.defenses = event.target.checked;
      await saveSettings();

      if (settings.defenses) Defenses.init();
      else Defenses.remove();
    });

    return row;
  }

  function createSpellFilterRow() {
    var row = document.createElement("div");
    row.className = "row";

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "settings-spellFilter";
    input.checked = settings.spellFilter;
    row.appendChild(input);

    var span = document.createElement("span");
    span.textContent = "SHOW SPELL FILTER";
    row.appendChild(span);

    input.addEventListener("change", async function (event) {
      settings.spellFilter = event.target.checked;
      await saveSettings();

      if (settings.spellFilter) Spells.initFilter();
      else Spells.removeFilter();
    });

    return row;
  }

  function createSpellViewRow() {
    var row = document.createElement("div");
    row.className = "row";

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = "settings-spellView";
    input.checked = settings.spellView;
    row.appendChild(input);

    var span = document.createElement("span");
    span.textContent = "SHOW C20 SPELL VIEW";
    row.appendChild(span);

    input.addEventListener("change", async function (event) {
      settings.spellView = event.target.checked;
      await saveSettings();

      if (settings.spellView) Spells.initUi();
      else Spells.removeUi();
    });

    return row;
  }

  function createTitleRow() {
    var titleRow = document.createElement("div");
    titleRow.className = "row title";

    var titleSpan = document.createElement("span");
    titleSpan.textContent = "C20 Settings";
    titleRow.appendChild(titleSpan);

    return titleRow;
  }

  async function saveSettings() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, settings, "settings");
  }

  async function loadSettings() {
    settings = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "settings");
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);

    if (settings === undefined) settings = {};
    if (settings.conditionCompendium === undefined || !games.includes(settings.conditionCompendium))
      settings.conditionCompendium = "off";
    if (settings.defenses === undefined) settings.defenses = true;
    if (settings.spellFilter === undefined) settings.spellFilter = true;
    if (settings.spellView === undefined) settings.spellView = true;
    await saveSettings();
  }

  var CharacterSettings = {
    init: async function init() {
      await loadSettings();
      await createUi();
    },
  };
  return CharacterSettings;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return CharacterSettings;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = CharacterSettings;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("CharacterSettings", []).factory("CharacterSettings", function () {
    return CharacterSettings;
  });
}
