var CompendiumEditor = (function () {
  stdEl = {
    game: null,
    category: null,
    entry: null,
  };

  advEl = {
    operation: null,
    game: null,
  };

  var settings = {
    editor: "ui",
    newCompendium: "",
    update: false,
  };

  // modal UI
  async function createModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-editor-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.maxWidth = "850px";

    var compendiumContent = document.createElement("div");
    compendiumContent.id = "c20-compendium-modal-content";
    compendiumContent.style.marginLeft = "15px";
    compendiumContent.style.marginTop = "10px";
    compendiumContent.style.maxHeight = "calc(100vh - 400px)";
    compendiumContent.style.overflowY = "auto";

    var advancedContent = document.createElement("div");
    advancedContent.id = "c20-advanced-modal-content";
    advancedContent.className = "hidden";
    advancedContent.style.maxHeight = "calc(100vh - 400px)";
    advancedContent.style.overflowY = "auto";

    var selectWrapper = document.createElement("div");
    selectWrapper.style.display = "flex";
    selectWrapper.style.flexFlow = "wrap";
    selectWrapper.style.gap = "20px";

    selectWrapper.appendChild(await createGameSelect(modal));
    selectWrapper.appendChild(createCategorySelect());
    selectWrapper.appendChild(createEntrySelect());
    selectWrapper.appendChild(createEditorRadio());

    compendiumContent.appendChild(selectWrapper);
    compendiumContent.appendChild(createEditor());
    advancedContent.appendChild(await createAdvancedEditor());

    modalContent.appendChild(createModalHeader());
    modalContent.appendChild(createProgressIndicator());
    modalContent.appendChild(compendiumContent);
    modalContent.appendChild(advancedContent);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  function createModalHeader() {
    var modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-compendium-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Compendium Editor";

    var btn = document.createElement("button");
    btn.textContent = "c";
    btn.title = "Import/Export";
    btn.id = "compendium-editor-advanced";
    btn.style.fontFamily = "pictos";
    btn.style.fontSize = "15px";
    btn.style.marginLeft = "10px";
    btn.addEventListener("click", toggleAdvancedEditor);

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    modalClose.onclick = function () {
      document.querySelector("#c20-editor-modal").remove();
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(btn);
    modalHeader.appendChild(modalClose);

    return modalHeader;
  }

  function createProgressIndicator() {
    var container = document.createElement("div");
    container.className = "progress-container";

    var bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.id = "modal-compendium-progress";

    container.appendChild(bar);
    return container;
  }

  // Select Menus
  async function createGameSelect() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    stdEl.game = new c20FieldSelect();
    var gameSelect = stdEl.game.create({
      name: "game",
      title: "Compendium",
      options: Array.from(games).map((x, i) => ({ text: x, value: x })),
      changeHandler: async function () {
        stdEl.category.reset();
        stdEl.category.disabled(stdEl.game.getValue() === "");
        stdEl.entry.reset();
        stdEl.entry.disabled(true);

        await updateEditor();
      },
    });

    return gameSelect;
  }

  function createCategorySelect() {
    stdEl.category = new c20FieldSelect();
    var categorySelect = stdEl.category.create({
      name: "category",
      title: "Category",
      options: [
        { text: "Backgrounds", value: "background" },
        { text: "Conditions", value: "condition" },
        { text: "Feats", value: "feat" },
        { text: "Spells", value: "spell" },
      ],
      changeHandler: async function () {
        stdEl.entry.reset();
        await updateCategorySelect();
      },
    });

    stdEl.category.disabled(true);

    return categorySelect;
  }

  function createEntrySelect() {
    stdEl.entry = new c20FieldComboBox();
    stdEl.entry.allowNewEntries(true);

    var entrySelect = stdEl.entry.create({
      name: "entry",
      title: "Entries",
      options: [],
      changeHandler: async function () {
        await updateEditor();
      },
    });
    stdEl.entry.disabled(true);

    return entrySelect;
  }

  function createEditorRadio() {
    var optionsDiv = document.createElement("div");
    optionsDiv.style.display = "absolute";
    optionsDiv.style.right = "10px";

    optionsDiv.appendChild(
      createRadioInput({
        id: "ui",
        name: "editor",
        title: "UI Editor",
        checked: settings.editor === "ui",
        changeHandler: updateEditorRadio,
      })
    );
    optionsDiv.appendChild(
      createRadioInput({
        id: "json",
        name: "editor",
        title: "JSON Editor",
        checked: settings.editor === "json",
        changeHandler: updateEditorRadio,
      })
    );

    return optionsDiv;
  }

  // Select Change Handlers
  async function updateGameSelect() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    games = Array.from(games)
      .sort()
      .map((x) => ({ value: x, text: x }));

    advEl.game.reset();
    advEl.game.updateOptions(games);
    stdEl.game.reset();
    stdEl.game.updateOptions(games);

    stdEl.category.reset();
    stdEl.category.disabled(true);
    stdEl.entry.reset();
    stdEl.entry.disabled(true);

    await updateEditor();
  }

  async function updateCategorySelect() {
    var categoryData = await StorageHelper.listItemsByType(
      StorageHelper.dbNames.compendiums,
      stdEl.game.getValue(),
      stdEl.category.getValue()
    );

    categoryData = Array.from(categoryData)
      .sort((a, b) => `${a.groupName ?? ""} ${a.name}`.trim().localeCompare(`${b.groupName ?? ""} ${b.name}`.trim()))
      .map((o) => ({
        value: o.id,
        text: `${o.groupName ?? ""} ${o.name}`.trim(),
      }));

    stdEl.entry.disabled(stdEl.category.getValue() === "");
    stdEl.entry.reset();
    stdEl.entry.updateOptions(categoryData);

    await updateEditor();
  }

  async function updateEditorRadio(event) {
    if (event.target.checked === true) {
      settings.editor = event.target.id;
      updateEditor();
    }
  }

  async function updateEditor() {
    disableSaveButton();

    if (stdEl.entry.getValue() == "") {
      document.querySelector("#compendium-editor").replaceChildren();
      document.querySelector("#editor-action").classList.add("hidden");
      return;
    }

    var entry;

    if (stdEl.entry.getValue() != -1)
      entry = await StorageHelper.getItem(
        StorageHelper.dbNames.compendiums,
        stdEl.game.getValue(),
        Number(stdEl.entry.getValue())
      );
    else if (stdEl.category.getValue() === "background")
      entry = {
        name: stdEl.entry.getTextValue().replace("Add ", "").replace("...", ""),
        description: "",
        type: "background",
        source: "",
      };
    else if (stdEl.category.getValue() === "condition")
      entry = {
        groupName: "",
        name: stdEl.entry.getTextValue().replace("Add ", "").replace("...", ""),
        description: "",
        short: [""],
        type: "condition",
        source: "",
      };
    else if (stdEl.category.getValue() === "feat")
      entry = {
        name: stdEl.entry.getTextValue().replace("Add ", "").replace("...", ""),
        description: "",
        type: "feat",
        source: "",
      };
    else if (stdEl.category.getValue() === "spell")
      entry = {
        level: "",
        name: stdEl.entry.getTextValue().replace("Add ", "").replace("...", ""),
        school: "",
        ritual: false,
        time: "",
        range: "",
        savingThrow: "",
        concentration: false,
        duration: "",
        damageType: "",
        description: "",
        type: "spell",
        source: "",
        verbal: false,
        somatic: true,
        material: false,
        higherLevels: "",
        damageRoll: "",
        healing: "",
        higherRoll: "",
        attack: "None",
        savingEffect: "",
      };

    document.querySelector("#editor-action").classList.remove("hidden");
    if (settings.editor === "json") {
      document.querySelector("#compendium-editor").replaceChildren(createJsonEditor(entry));
    } else if (settings.editor === "ui") {
      if (stdEl.category.getValue() === "background")
        document.querySelector("#compendium-editor").replaceChildren(createTraitEditor(entry));
      if (stdEl.category.getValue() === "condition")
        document.querySelector("#compendium-editor").replaceChildren(createConditionsEditor(entry));
      if (stdEl.category.getValue() === "feat")
        document.querySelector("#compendium-editor").replaceChildren(createTraitEditor(entry));
      else if (stdEl.category.getValue() === "spell")
        document.querySelector("#compendium-editor").replaceChildren(createSpellEditor(entry));
    }
  }

  // Editors
  function createEditor() {
    var editor = document.createElement("div");

    var body = document.createElement("div");
    body.id = "compendium-editor";
    body.style.minHeight = "250px";

    body.addEventListener("input", enableSaveButton);

    editor.appendChild(body);
    editor.appendChild(createErrorWrapper());
    editor.appendChild(createEditButtons());

    return editor;
  }

  function createJsonEditor(data) {
    var editor = document.createElement("div");
    editor.id = "compendium-rawEditor";

    var textArea = document.createElement("textarea");
    textArea.id = "compendium-rawEditor-textarea";
    textArea.style.width = "97%";
    textArea.style.maxWidth = "97%";
    textArea.style.height = "300px";
    textArea.style.fieldSizing = "content";
    textArea.style.marginTop = "10px";
    textArea.value = JSON.stringify(data, null, 2);

    editor.appendChild(textArea);

    return editor;
  }

  function createConditionsEditor(data) {
    var editor = document.createElement("form");
    editor.style.margin = "20px 0 30px 0";

    editor.appendChild(
      createTextInput({ name: "groupName", title: "Group Name", value: data?.groupName ?? "", required: false })
    );
    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name, required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));
    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description,
        required: false,
        height: 320,
      })
    );
    editor.appendChild(
      createTextArray({ name: "short[]", title: "Short Description", values: data.short, required: false })
    );
    editor.appendChild(createHiddenInput({ name: "type", value: data.type }));
    if (data.id !== undefined) editor.appendChild(createHiddenInput({ name: "id", value: data.id }));

    return editor;
  }

  function createTraitEditor(data) {
    var editor = document.createElement("form");
    editor.style.margin = "20px 0 30px 0";

    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name, required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));

    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description,
        required: false,
        height: 320,
      })
    );

    editor.appendChild(createHiddenInput({ name: "type", value: data.type }));
    if (data.id !== undefined) editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    return editor;
  }

  function createSpellEditor(data) {
    var editor = document.createElement("form");
    editor.style.margin = "20px 0 30px 0";

    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name, required: true }));
    editor.appendChild(
      createSelectInput({
        name: "level",
        title: "Level",
        value: data.level,
        required: true,
        options: [
          { name: "Cantrip", value: "cantrip" },
          { name: "1st", value: "1" },
          { name: "2nd", value: "2" },
          { name: "3rd", value: "3" },
          { name: "4th", value: "4" },
          { name: "5th", value: "5" },
          { name: "6th", value: "6" },
          { name: "7th", value: "7" },
          { name: "8th", value: "8" },
          { name: "9th", value: "9" },
        ],
      })
    );
    editor.appendChild(
      createSelectInput({
        name: "school",
        title: "School",
        value: data.school,
        required: true,
        options: [
          { name: "Abjuration", value: "abjuration" },
          { name: "Conjuration", value: "conjuration" },
          { name: "Divination", value: "divination" },
          { name: "Enchantment", value: "enchantment" },
          { name: "Evocation", value: "evocation" },
          { name: "Illusion", value: "illusion" },
          { name: "Necromancy", value: "necromancy" },
          { name: "Transmutation", value: "transmutation" },
        ],
      })
    );
    editor.appendChild(createTextInput({ name: "time", title: "Casting Time", value: data.time, required: true }));
    editor.appendChild(createTextInput({ name: "range", title: "Range/Area", value: data.range, required: false }));
    editor.appendChild(createTextInput({ name: "duration", title: "Duration", value: data.duration, required: false }));
    editor.appendChild(
      createSelectInput({
        name: "savingThrow",
        title: "Saving Throw",
        value: data.savingThrow ?? "",
        required: false,
        options: [
          { name: "Strength", value: "Strength" },
          { name: "Dexterity", value: "Dexterity" },
          { name: "Constitution", value: "Constitution" },
          { name: "Intelligence", value: "Intelligence" },
          { name: "Wisdom", value: "Wisdom" },
          { name: "Charisma", value: "Charisma" },
        ],
      })
    );

    editor.appendChild(
      createTextInput({ name: "savingEffect", title: "Saving Effect", value: data.savingEffect, required: false })
    );

    editor.appendChild(
      createCheckboxInput({ name: "concentration", title: "Concentration", value: data.concentration, required: false })
    );
    editor.appendChild(createCheckboxInput({ name: "ritual", title: "Ritual", value: data.ritual, required: false }));

    editor.appendChild(createCheckboxInput({ name: "verbal", title: "Verbal", value: data.verbal, required: false }));
    editor.appendChild(
      createCheckboxInput({ name: "somatic", title: "Somatic", value: data.somatic, required: false })
    );
    editor.appendChild(
      createCheckboxInput({ name: "material", title: "Material", value: data.material, required: false })
    );

    editor.appendChild(
      createTextInput({ name: "materials", title: "Materials", value: data.materials, required: false })
    );

    editor.appendChild(
      createSelectInput({
        name: "attack",
        title: "Attack",
        value: data.attack,
        required: true,
        options: [
          { name: "None", value: "None" },
          { name: "Melee", value: "Melee" },
          { name: "Ranged", value: "Ranged" },
        ],
      })
    );
    editor.appendChild(createTextInput({ name: "healing", title: "Healing", value: data.healing, required: false }));
    editor.appendChild(
      createTextInput({ name: "damageRoll", title: "Damage", value: data.damageRoll, required: false })
    );
    editor.appendChild(
      createTextInput({ name: "damageType", title: "Damage Type/Effect", value: data.damageType, required: false })
    );
    editor.appendChild(
      createCheckboxInput({
        name: "abilityModifier",
        title: "Add Ability Modifier to Damage/Healing",
        value: data.abilityModifier,
        required: false,
      })
    );

    editor.appendChild(
      createTextAreaInput({ name: "description", title: "Description", value: data.description, required: false })
    );

    editor.appendChild(
      createTextAreaInput({
        name: "higherLevels",
        title: "At Higher Levels",
        value: data.higherLevels,
        required: false,
      })
    );

    editor.appendChild(
      createTextInput({ name: "higherRoll", title: "Higher Level Roll", value: data.higherRoll, required: false })
    );

    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));
    editor.appendChild(createHiddenInput({ name: "type", value: data.type }));

    editor.childNodes[18].style.marginBottom = "10px";
    if (data.id !== undefined) editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    if (data.savingThrow === "") editor.childNodes[7].childNodes[1].disabled = true;
    if (data.material === false || data.material === undefined) editor.childNodes[13].childNodes[1].disabled = true;

    editor.childNodes[6].addEventListener("change", function (event) {
      editor.childNodes[7].childNodes[1].disabled = event.target.value === "";
    });

    editor.childNodes[12].addEventListener("change", function (event) {
      editor.childNodes[13].childNodes[1].disabled = !event.target.checked;
    });

    return editor;
  }

  // Edit Change Handlers
  function createEditButtons() {
    var div = document.createElement("div");
    div.id = "editor-action";
    div.className = "hidden";

    var saveButton = document.createElement("button");
    saveButton.id = "save-button";
    saveButton.textContent = "Save Entry";
    saveButton.className = "btn";
    saveButton.style.marginLeft = "10px";
    saveButton.style.marginRight = "10px";
    saveButton.style.float = "right";
    saveButton.disabled = true;

    saveButton.addEventListener("click", async function (event) {
      event.preventDefault();

      var validateResponse = validateEntry();
      if (validateResponse.valid === true) {
        var itemId = await StorageHelper.addOrUpdateItem(
          StorageHelper.dbNames.compendiums,
          stdEl.game.getValue(),
          validateResponse.entry
        );

        await updateCategorySelect();
        stdEl.entry.setValue(itemId);
        await updateEditor();
      }
    });

    var deleteButton = document.createElement("button");
    deleteButton.id = "delete-button";
    deleteButton.textContent = "Delete Entry";
    deleteButton.className = "btn";

    deleteButton.addEventListener("click", async function (event) {
      event.preventDefault();
      await StorageHelper.deleteItem(
        StorageHelper.dbNames.compendiums,
        stdEl.game.getValue(),
        Number(stdEl.entry.getValue())
      );
      await updateCategorySelect();
    });

    div.appendChild(saveButton);
    div.appendChild(deleteButton);

    return div;
  }

  function enableSaveButton() {
    var saveBtn = document.querySelector("#editor-action #save-button");
    saveBtn.disabled = false;
    saveBtn.classList.add("btn-primary");
  }

  function disableSaveButton() {
    var saveBtn = document.querySelector("#editor-action #save-button");
    saveBtn.disabled = true;
    saveBtn.classList.remove("btn-primary");
  }

  // Validators
  function validateEntry() {
    var validateResponse = { valid: false, entry: {} };
    if (settings.editor === "json") {
      var jsonData = document.querySelector("#compendium-rawEditor-textarea").value;
      validateDefaultJson(jsonData);
      document.getElementById("compendium-error-wrapper").replaceChildren(...validateResponse.errors);
    } else {
      var form = document.querySelector("#c20-compendium-modal-content form");
      validateResponse.valid = form.reportValidity();

      // get form data and update fields as necessary
      var formData = new FormData(form);

      for (const [key, value] of formData.entries()) {
        if (key.endsWith("[]")) {
          const arrayKey = key.slice(0, -2); // Remove '[]'
          if (!validateResponse.entry[arrayKey]) {
            validateResponse.entry[arrayKey] = [];
          }
          validateResponse.entry[arrayKey].push(value);
        } else if (key === "id") {
          validateResponse.entry[key] = Number(value);
        } else {
          validateResponse.entry[key] = value;
        }
      }
    }

    if (validateResponse.valid === true) {
      // common validations
      validateResponse.entry.type = stdEl.category.getValue();
      if (validateResponse.entry.groupName == undefined) validateResponse.entry["groupName"] = "";
      if (validateResponse.entry.source == undefined || validateResponse.entry.source === "")
        validateResponse.entry["source"] = "Unknown";

      validateResponse.entry.names = [validateResponse.entry.name.toLowerCase()];
      if (validateResponse.entry.groupName !== "")
        validateResponse.entry.names.push(validateResponse.entry.groupName.toLowerCase());

      if (validateResponse.entry.type === "spell") {
        validateResponse.entry.description = validateResponse.entry.description;
        validateResponse.entry.higherLevels = validateResponse.entry.higherLevels;
      }
    }
    return validateResponse;
  }

  function validateDefaultJson(jsonData) {
    var errors = [];
    var data;

    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      errors.push(createErrorMessage("Invalid JSON format. Please correct and try again."));
      return { valid: errors.length === 0, errors: errors, entry: data };
    }

    if (!data.name) errors.push(createErrorMessage("Missing property 'name'"));
    else if (typeof data.name !== "string") errors.push(createErrorMessage("The 'name' property must be a string."));
    else if (data.name.trim() === "") errors.push(createErrorMessage("The 'name' property cannot be empty."));

    return { valid: errors.length === 0, errors: errors, entry: data };
  }

  // Error Helpers
  function createErrorWrapper() {
    var errorWrapper = document.createElement("div");
    errorWrapper.id = "compendium-error-wrapper";
    errorWrapper.style.color = "red";
    return errorWrapper;
  }

  function createErrorMessage(message) {
    var errorMessage = document.createElement("p");
    errorMessage.className = "condition-error-message";
    errorMessage.textContent = message;
    return errorMessage;
  }

  // Advanced Editor
  async function createAdvancedEditor() {
    var group = document.createElement("div");
    group.style.minHeight = "250px";
    group.style.margin = "10px 0 0 15px";
    group.appendChild(await createAdvancedTypeInput());
    group.appendChild(await createAdvancedGameInput());
    group.appendChild(createAdvancedNewGameInput());
    group.appendChild(createAdvancedImportUpdate());
    group.appendChild(createAdvancedSubmitButton());

    return group;
  }

  async function createAdvancedTypeInput() {
    advEl.operation = new c20FieldSelect();

    var typeSelect = advEl.operation.create({
      name: "operation",
      title: "Operation",
      options: [
        { text: "Create Compendium", value: "create" },
        { text: "Import Compendium", value: "import" },
        { text: "Export Compendium", value: "export" },
        {
          text: "Delete Compendium",
          value: "delete",
        },
      ],
      changeHandler: async function () {
        var combobox = document.querySelector("#c20-advanced-modal-content .c20-combobox");
        var inputBox = document.querySelector("#c20-advanced-modal-content input[name='advNewGame']").parentElement;

        advEl.game.reset();
        inputBox.childNodes[1].value = "";

        if (advEl.operation.getValue() === "") advEl.game.disabled(true);
        else advEl.game.disabled(false);

        if (advEl.operation.getValue() === "create") {
          combobox.classList.add("hidden");
          inputBox.classList.remove("hidden");
        } else {
          inputBox.classList.add("hidden");
          combobox.classList.remove("hidden");
        }

        if (advEl.operation.getValue() === "import")
          document.querySelector("#c20-import-update").classList.remove("hidden");
        else document.querySelector("#c20-import-update").classList.add("hidden");

        await updateSubmitButton();
      },
    });

    return typeSelect;
  }

  async function createAdvancedGameInput() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    advEl.game = new c20FieldComboBox();

    var input = advEl.game.create({
      name: "advGame",
      title: "Compendium Name",
      required: false,
      options: Array.from(games).map((x) => ({ text: x, value: x })),
      changeHandler: async function () {
        await updateSubmitButton();
      },
    });

    advEl.game.disabled(true);
    input.style.width = "220px";
    return input;
  }

  function createAdvancedNewGameInput() {
    var input = createTextInput({ name: "advNewGame", title: "Compendium Name" });
    input.classList.add("hidden");
    input.style.width = "230px";
    input.addEventListener("input", async function (event) {
      settings.newCompendium = event.target.value;
      await updateSubmitButton();
    });

    return input;
  }

  function createAdvancedImportUpdate() {
    var group = createCheckboxInput({ name: "import-update", title: "Update", value: false });
    group.classList.add("hidden");
    group.id = "c20-import-update";
    group.childNodes[0].addEventListener("change", async function (event) {
      settings.update = event.target.checked;
      updateSubmitButton();
    });
    return group;
  }

  function createAdvancedSubmitButton() {
    var group = document.createElement("div");
    group.style.marginTop = "30px";

    var helper = document.createElement("div");
    helper.id = "compendium-adv-help";

    var btn = document.createElement("button");
    btn.id = "compendium-adv-submit";
    btn.className = "btn hidden";
    btn.style.marginTop = "10px";

    btn.addEventListener("click", async function () {
      var progress = document.querySelector("#modal-compendium-progress");
      progress.style.display = "block";

      try {
        if (advEl.operation.getValue() === "delete") {
          await StorageHelper.deleteObjectStore(StorageHelper.dbNames.compendiums, advEl.game.getValue());
          await updateGameSelect();
        } else if (advEl.operation.getValue() === "export") {
          await StorageHelper.exportObjectStore(
            StorageHelper.dbNames.compendiums,
            advEl.game.getValue(),
            `c20_compendium_${advEl.game.getValue()}.json`
          );
        } else if (advEl.operation.getValue() === "import") {
          var [handle] = await window.showOpenFilePicker({
            types: [{ accept: { "application/json": [".json"] } }],
          });
          const file = await handle.getFile();
          var jsonData = JSON.parse(await file.text());

          // clean & validate
          jsonData.forEach((item) => {
            if (item.name === undefined) throw new Error(`Missing 'name' property for ${JSON.stringify(item)}`);
            if (item.type === undefined) throw new Error(`Missing 'type' property for ${JSON.stringify(item)}`);
            if (item.id !== undefined) delete item.id;
            if (item.source == undefined) item["source"] = "Unknown";
            if (item.type === "condition") if (item.groupName == undefined) item["groupName"] = "";
            if (item.type === "spell") {
              item.description = item.description;
              item.higherLevels = item.higherLevels;
            }

            if (item.names === undefined) {
              item["names"] = [item.name.toLowerCase()];

              if (item.groupName !== undefined && item.groupName !== "")
                item["names"].push(item.groupName.toLowerCase());
            }
          });

          await StorageHelper.importObjectStore(
            StorageHelper.dbNames.compendiums,
            advEl.game.getValue(),
            jsonData,
            settings.update
          );
          await updateGameSelect();
        } else if (advEl.operation.getValue() === "create") {
          await StorageHelper.createObjectStore(
            StorageHelper.dbNames.compendiums,
            document.querySelector("#c20-advanced-modal-content input[name='advNewGame']").value
          );
          await updateGameSelect();
        }
        helper.textContent = "Operation Successfully Completed";
        btn.disabled = true;
      } catch (e) {
        helper.textContent = `Error: ${e}`;
      } finally {
        progress.style.display = "none";
      }
    });

    group.appendChild(helper);
    group.appendChild(btn);

    return group;
  }

  async function toggleAdvancedEditor() {
    var advContent = document.querySelector("#c20-advanced-modal-content");
    var cpContent = document.querySelector("#c20-compendium-modal-content");
    var btn = document.querySelector("#compendium-editor-advanced");

    if (advContent.classList.contains("hidden")) {
      cpContent.classList.add("hidden");
      advContent.classList.remove("hidden");
      btn.style.color = "blueviolet";
    } else {
      advContent.classList.add("hidden");
      cpContent.classList.remove("hidden");
      btn.style.color = "black";
    }
  }

  async function updateSubmitButton() {
    var btn = document.querySelector("#compendium-adv-submit");
    var helper = document.querySelector("#compendium-adv-help");

    if (!advEl.operation.getValue()) {
      resetAdvSubmitButton(btn, helper);
      return;
    }

    if (advEl.operation.getValue() === "create") {
      var inputBox = document.querySelector("#c20-advanced-modal-content input[name='advNewGame']");
      if (
        !inputBox.value ||
        (await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, inputBox.value))
      ) {
        resetAdvSubmitButton(btn, helper);
        return;
      }

      btn.classList.remove("hidden");
      btn.textContent = "Create";
      helper.textContent = "";

      return;
    }

    if (
      !advEl.game.getValue() ||
      !(await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, advEl.game.getValue()))
    ) {
      resetAdvSubmitButton(btn, helper);
      return;
    }

    btn.classList.remove("hidden");
    btn.disabled = false;

    if (advEl.operation.getValue() === "delete") {
      btn.textContent = "Delete";
      btn.disabled = false;
      helper.textContent = "*Compendium will be deleted from C20.";
      return;
    }

    if (advEl.operation.getValue() === "import") {
      btn.textContent = "Import";
      btn.disabled = false;

      if (settings.update) helper.textContent = "*Will update existing records that match on category and name";
      else helper.textContent = "*Will ignores imported records that already exist";
      return;
    }

    if (advEl.operation.getValue() === "export") {
      btn.textContent = "Export";
      helper.textContent = "";
      btn.disabled = false;
    }
  }

  function resetAdvSubmitButton(btn, helper) {
    btn.classList.add("hidden");
    helper.textContent = "";
  }

  var CompendiumEditor = {
    show: async function show() {
      await createModal();
    },
  };

  return CompendiumEditor;
})();
