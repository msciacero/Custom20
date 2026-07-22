var CharacterSettings = (function () {
  var settings = {};

  async function createUi() {
    var container = document.createElement("div");
    container.id = "c20-character-settings";

    container.appendChild(createCheckboxRow({ name: "defenses", title: "show defenses", event: defenseEvent }));
    container.appendChild(
      createCheckboxRow({ name: "itemView", title: "show enhanced inventory", event: inventoryEvent }),
    );
    container.appendChild(createCheckboxRow({ name: "traitsView", title: "show styled traits", event: traitsEvent }));
    container.appendChild(
      createCheckboxRow({ name: "spellFilter", title: "show spell filter", event: spellFilterEvent }),
    );
    container.appendChild(createCheckboxRow({ name: "spellView", title: "show spell view", event: spellFilterEvent }));
    container.appendChild(
      createSelectRow({
        name: "conditionCompendium",
        title: "conditions",
        options: await getConditionOptions(),
        event: conditionsEvent,
      }),
    );
    container.appendChild(
      createColorRow({ name: "itemAttunementColor", title: "attunement item color", event: itemAttunementColorEvent }),
    );
    container.appendChild(
      createColorRow({ name: "itemMagicColor", title: "magic item color", event: itemMagicColorEvent }),
    );
    container.appendChild(createButtonRow({ title: "set as default", event: defaultEvent }));
    container.appendChild(createButtonRow({ title: "reset to default", event: resetEvent }));
    container.appendChild(createTitleRow());

    document.querySelector(".page.options .general_options").after(container);
  }

  function createButtonRow(data) {
    var row = document.createElement("div");
    row.className = "row";

    var button = document.createElement("button");
    button.textContent = data.title.toUpperCase();
    button.addEventListener("click", data.event);

    row.appendChild(button);

    return row;
  }

  function createCheckboxRow(data) {
    var row = document.createElement("div");
    row.className = "row";

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = `settings-${data.name}`;
    input.checked = settings[data.name];
    row.appendChild(input);

    var span = document.createElement("span");
    span.textContent = data.title.toUpperCase();
    row.appendChild(span);

    input.addEventListener("change", data.event);

    return row;
  }

  function createColorRow(data) {
    var row = document.createElement("div");
    row.className = "row";

    var span = document.createElement("span");
    span.textContent = `${data.title.toUpperCase()}:`;
    row.appendChild(span);

    var input = document.createElement("input");
    input.type = "color";
    input.name = `settings-${data.name}`;
    input.value = settings[data.name];
    row.appendChild(input);

    input.addEventListener("input", data.event);

    return row;
  }

  function createSelectRow(data) {
    var row = document.createElement("div");
    row.className = "row";

    var span = document.createElement("span");
    span.textContent = `${data.title.toUpperCase()}:`;
    row.appendChild(span);

    var select = document.createElement("select");
    select.name = `settings-${data.name}`;
    select.value = settings[data.name];

    data.options.forEach((g) => {
      var option = document.createElement("option");
      option.value = g.value;
      option.textContent = g.name;
      select.appendChild(option);
    });

    select.addEventListener("change", data.event);

    row.appendChild(select);
    return row;
  }

  async function getConditionOptions() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    games.sort((a, b) => {
      return a.localeCompare(b);
    });

    if (!games.includes(settings.conditionCompendium)) settings.conditionCompendium = "Off";

    var conditionOptions = games.map((g) => ({ name: g, value: g }));
    conditionOptions.push({ name: "Off", value: "off" });

    return conditionOptions;
  }

  async function conditionsEvent(event) {
    settings.conditionCompendium = event.target.value;
    await saveSettings();

    if (settings.conditionCompendium === "off") Conditions.remove();
    else Conditions.init();
  }

  async function defaultEvent() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, "all", settings, "settings");
  }

  async function defenseEvent(event) {
    settings.defenses = event.target.checked;
    await saveSettings();

    if (settings.defenses) Defenses.init();
    else Defenses.remove();
  }

  async function itemAttunementColorEvent(event) {
    settings.itemAttunementColor = event.target.value;
    await saveSettings();
    Inventory.updateUi();
  }

  async function itemMagicColorEvent(event) {
    settings.itemMagicColor = event.target.value;
    await saveSettings();
    await Inventory.updateUi();
  }

  async function inventoryEvent(event) {
    settings.itemView = event.target.checked;
    await saveSettings();

    if (settings.itemView) Inventory.init();
    else Inventory.remove();
  }

  async function resetEvent() {
    var df = await StorageHelper.getItem(StorageHelper.dbNames.characters, "all", "settings");
    df = await checkSettingValues(df);
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, df, "settings");

    if (settings.defenses !== df.defenses) {
      if (df.defenses) Defenses.init();
      else Defenses.remove();
    }

    if (settings.spellFilter !== df.spellFilter) {
      if (df.spellFilter) Spells.initFilter();
      else Spells.removeFilter();
    }

    if (settings.spellView !== df.spellView) {
      if (df.spellView) Spells.initUi();
      else Spells.removeUi();
    }

    if (settings.itemAttunementColor !== df.itemAttunementColor) {
      Inventory.updateUi();
    }

    if (settings.itemMagicColor !== df.itemMagicColor) {
      Inventory.updateUi();
    }

    if (settings.traitsView !== df.traitsView) {
      if (df.traitsView) Traits.init();
      else Traits.remove();
    }

    if (settings.itemView !== df.itemView) {
      if (df.itemView) Inventory.init();
      else Inventory.remove();
    }

    document.querySelector("#c20-character-settings").remove();
    CharacterSettings.init();

    if (settings.conditionCompendium === df.conditionCompendium) {
      if (df.conditionCompendium === "off") Conditions.remove();
      else Conditions.init();
    }
  }

  async function spellFilterEvent(event) {
    settings.spellFilter = event.target.checked;
    await saveSettings();

    if (settings.spellFilter) Spells.initFilter();
    else Spells.removeFilter();
  }

  async function spellViewEvent(event) {
    settings.spellView = event.target.checked;
    await saveSettings();

    if (settings.spellView) Spells.initUi();
    else Spells.removeUi();
  }

  async function traitsEvent(event) {
    settings.traitsView = event.target.checked;
    await saveSettings();

    if (settings.traitsView) Traits.init();
    else Traits.remove();
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

    if (settings === undefined) {
      settings = await StorageHelper.getItem(StorageHelper.dbNames.characters, "all", "settings");
      if (settings === undefined) settings = {};
    }
    settings = await checkSettingValues(settings);
    await saveSettings();
  }

  async function checkSettingValues(data) {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);

    if (data.conditionCompendium === undefined || !games.includes(data.conditionCompendium))
      data.conditionCompendium = "off";
    if (data.defenses === undefined) data.defenses = true;
    if (data.spellFilter === undefined) data.spellFilter = true;
    if (data.spellView === undefined) data.spellView = true;
    if (data.itemAttunementColor === undefined) data.itemAttunementColor = "";
    if (data.itemMagicColor === undefined) data.itemMagicColor = "";
    if (data.traitsView === undefined) data.traitsView = true;
    if (data.itemView === undefined) data.itemView = true;

    return data;
  }

  var CharacterSettings = {
    init: async function init() {
      await loadSettings();
      await createUi();
    },
    get settings() {
      return settings;
    },
  };
  return CharacterSettings;
})();
