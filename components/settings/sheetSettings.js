var CharacterSettings = (function () {
  let settings = {};

  async function createUi() {
    // Avoid creating duplicate containers if init fires multiple times
    if (document.querySelector("#c20-character-settings")) return;

    const container = document.createElement("div");
    container.id = "c20-character-settings";

    container.appendChild(createCheckboxRow({ name: "defenses", title: "show defenses", event: defenseEvent }));
    container.appendChild(
      createCheckboxRow({ name: "itemView", title: "show enhanced inventory", event: inventoryEvent }),
    );
    container.appendChild(createCheckboxRow({ name: "traitsView", title: "show styled traits", event: traitsEvent }));
    container.appendChild(
      createCheckboxRow({ name: "spellFilter", title: "show spell filter", event: spellFilterEvent }),
    );
    container.appendChild(createCheckboxRow({ name: "spellView", title: "show spell view", event: spellViewEvent }));

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

    // FIXED: Defensive safeguard interceptor to defend against asynchronous sheet parsing races
    const anchorPoint = document.querySelector(".page.options .general_options");
    if (anchorPoint) {
      anchorPoint.after(container);
    } else {
      console.warn("[C20] Aborting settings injection: '.page.options .general_options' anchor node missing.");
    }
  }

  function createButtonRow(data) {
    const row = document.createElement("div");
    row.className = "row";

    const button = document.createElement("button");
    button.textContent = (data.title || "").toUpperCase();
    button.addEventListener("click", data.event);

    row.appendChild(button);
    return row;
  }

  function createCheckboxRow(data) {
    const row = document.createElement("div");
    row.className = "row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `settings-${data.name}`;
    input.checked = !!settings[data.name]; // Coerce safely to strict boolean values
    row.appendChild(input);

    const span = document.createElement("span");
    span.textContent = (data.title || "").toUpperCase();
    row.appendChild(span);

    input.addEventListener("change", data.event);
    return row;
  }

  function createColorRow(data) {
    const row = document.createElement("div");
    row.className = "row";

    const span = document.createElement("span");
    span.textContent = `${(data.title || "").toUpperCase()}:`;
    row.appendChild(span);

    const input = document.createElement("input");
    input.type = "color";
    input.name = `settings-${data.name}`;
    input.value = settings[data.name] || "#000000"; // Enforce safe structural hex fallback codes
    row.appendChild(input);

    input.addEventListener("input", data.event);
    return row;
  }

  function createSelectRow(data) {
    const row = document.createElement("div");
    row.className = "row";

    const span = document.createElement("span");
    span.textContent = `${(data.title || "").toUpperCase()}:`;
    row.appendChild(span);

    const select = document.createElement("select");
    select.name = `settings-${data.name}`;
    select.style.width = "auto";

    // FIXED: Appended options completely to the DOM tree PRIOR to verifying index mapping selections
    data.options.forEach((g) => {
      const option = document.createElement("option");
      option.value = g.value;
      option.textContent = g.name;

      // Explicit option selected parameter tag verification
      if (g.value === settings[data.name]) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Enforce safe post-append backup alignment value references
    select.value = settings[data.name] || data.options[0]?.value || "";
    select.addEventListener("change", data.event);

    row.appendChild(select);
    return row;
  }

  async function getConditionOptions() {
    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    games.sort((a, b) => a.localeCompare(b));

    if (!games.includes(settings.conditionCompendium)) {
      settings.conditionCompendium = "off";
    }

    const conditionOptions = games.map((g) => ({ name: g, value: g }));
    conditionOptions.push({ name: "Off", value: "off" });

    return conditionOptions;
  }

  // Shared implementation logic wrappers for state events mapping
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
    Inventory.updateUi();
  }

  async function inventoryEvent(event) {
    settings.itemView = event.target.checked;
    await saveSettings();

    if (settings.itemView) Inventory.init();
    else Inventory.remove();
  }

  async function resetEvent() {
    let df = await StorageHelper.getItem(StorageHelper.dbNames.characters, "all", "settings");
    df = await checkSettingValues(df);

    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, df, "settings");

    // Process diff adjustments linearly without cross-tab reference desync locks
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

    if (settings.itemAttunementColor !== df.itemAttunementColor || settings.itemMagicColor !== df.itemMagicColor) {
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

    if (settings.conditionCompendium !== df.conditionCompendium) {
      if (df.conditionCompendium === "off") Conditions.remove();
      else Conditions.init();
    }

    // FIXED: Shallow clone the updated configuration values directly back into memory to maintain a single source of truth cleanly
    settings = { ...df };

    // Re-render UI inputs cleanly without crashing execution closure contexts
    const settingsPanelNode = document.querySelector("#c20-character-settings");
    if (settingsPanelNode) {
      settingsPanelNode.remove();
      await createUi();
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
    const titleRow = document.createElement("div");
    titleRow.className = "row title";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = "C20 Settings";
    titleRow.appendChild(titleSpan);

    return titleRow;
  }

  async function saveSettings() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, settings, "settings");
  }

  async function loadSettings() {
    let storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "settings");
    let needsInitialSave = false;

    if (storedData === undefined) {
      storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, "all", "settings");
      if (storedData === undefined) {
        storedData = {};
        needsInitialSave = true; // Only write if completely empty database space
      }
    }

    settings = await checkSettingValues(storedData);

    // FIXED: Shield multi-tab storage layers from unnecessary boot-time connection teardown loops
    if (needsInitialSave) {
      await saveSettings();
    }
  }

  async function checkSettingValues(data) {
    if (!data) data = {};
    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);

    // FIXED: Upgraded primitive strict evaluations to handle both null and undefined values safely
    if (
      data.conditionCompendium === undefined ||
      data.conditionCompendium === null ||
      !games.includes(data.conditionCompendium)
    ) {
      data.conditionCompendium = "off";
    }

    if (data.defenses ?? true) data.defenses = true;
    if (data.spellFilter ?? true) data.spellFilter = true;
    if (data.spellView ?? true) data.spellView = true;
    if (data.itemAttunementColor === undefined || data.itemAttunementColor === null) data.itemAttunementColor = "";
    if (data.itemMagicColor === undefined || data.itemMagicColor === null) data.itemMagicColor = "";
    if (data.traitsView ?? true) data.traitsView = true;
    if (data.itemView ?? true) data.itemView = true;

    return data;
  }

  const CharacterSettings = {
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
