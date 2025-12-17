var CompendiumEditor = (function () {
  var settings = {
    game: "",
    category: "",
    entry: "",
    editor: "ui",
    advOperation: "",
    advGame: "",
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
    var gameSelect = createSelectInput({
      name: "game",
      title: "Game",
      options: Array.from(games).map((x, i) => ({ name: x, value: x })),
    });

    gameSelect.id = "compendium-game-select";
    gameSelect.addEventListener("change", async function (event) {
      settings.game = event.target.value;

      settings.category = "";
      var settingsSelect = document.querySelector("#c20-compendium-modal-content select[name='category']");
      settingsSelect.value = "";
      settingsSelect.disabled = false;

      settings.entry = "";
      var entrySelect = document.querySelector("#c20-compendium-modal-content select[name='entry']");
      entrySelect.value = "";
      entrySelect.disabled = true;

      await updateEditor();
    });
    return gameSelect;
  }

  function createCategorySelect() {
    var categorySelect = createSelectInput({
      name: "category",
      title: "Category",
      options: [
        {
          name: "Conditions",
          value: "condition",
        },
        { name: "Spells", value: "spell" },
      ],
    });

    categorySelect.childNodes[1].disabled = true;
    categorySelect.addEventListener("change", async function (event) {
      settings.category = event.target.value;

      settings.entry = "";
      await updateCategorySelect();
    });

    return categorySelect;
  }

  function createEntrySelect() {
    var entrySelect = createSelectInput({
      name: "entry",
      title: "Entries",
      options: [],
    });

    entrySelect.childNodes[1].disabled = true;
    entrySelect.addEventListener("change", async function (event) {
      settings.entry = isNaN(event.target.value) ? event.target.value : Number(event.target.value);
      await updateEditor();
    });

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
        text: "UI Editor",
        checked: settings.editor === "ui",
        changeHandler: updateEditorRadio,
      })
    );
    optionsDiv.appendChild(
      createRadioInput({
        id: "json",
        name: "editor",
        text: "JSON Editor",
        checked: settings.editor === "json",
        changeHandler: updateEditorRadio,
      })
    );

    return optionsDiv;
  }

  // Select Change Handlers
  async function updateGameSelect() {
    settings.advGame = "";
    settings.game = "";

    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    var gameAdvSelect = document.querySelector("#gameOptions");
    var gameEdiSelect = document.querySelector("#compendium-game-select").childNodes[1];
    document.querySelector("#advGame").value = "";
    gameEdiSelect.value = "";

    gameAdvSelect.replaceChildren();
    gameEdiSelect.replaceChildren(gameEdiSelect.firstChild);

    Array.from(games).forEach((o) => {
      var option = document.createElement("option");
      option.value = o;
      option.textContent = o;
      gameAdvSelect.appendChild(option);
      gameEdiSelect.appendChild(option.cloneNode(true));
    });

    settings.category = "";
    var settingsSelect = document.querySelector("#c20-compendium-modal-content select[name='category']");
    settingsSelect.value = "";
    settingsSelect.disabled = true;

    settings.entry = "";
    var entrySelect = document.querySelector("#c20-compendium-modal-content select[name='entry']");
    entrySelect.value = "";
    entrySelect.disabled = true;

    await updateEditor();
  }

  async function updateCategorySelect() {
    var entrySelect = document.querySelector("#c20-compendium-modal-content select[name='entry']");
    entrySelect.value = settings.category;
    entrySelect.disabled = false;

    var option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Select --";
    option.style.fontStyle = "italic";
    entrySelect.replaceChildren(option);

    var existingData = await StorageHelper.listItemsByType(
      StorageHelper.dbNames.compendiums,
      settings.game,
      settings.category
    );

    Array.from(existingData)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((o) => {
        var option = document.createElement("option");
        option.value = o.id;
        option.textContent = o.groupName ? `${o.groupName} ${o.name}` : o.name;
        entrySelect.appendChild(option);
      });

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

    if (settings.entry === "") {
      document.querySelector("#compendium-editor").replaceChildren();
      document.querySelector("#editor-action").classList.add("hidden");
      return;
    }

    var entry = await StorageHelper.getItem(StorageHelper.dbNames.compendiums, settings.game, settings.entry);

    document.querySelector("#editor-action").classList.remove("hidden");
    if (settings.editor === "json") {
      document.querySelector("#compendium-editor").replaceChildren(createJsonEditor(entry));
    } else if (settings.editor === "ui") {
      if (settings.category === "condition")
        document.querySelector("#compendium-editor").replaceChildren(createConditionsEditor(entry));
      else if (settings.category === "spell")
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
      createTextInput({ name: "groupName", title: "Group Name", value: data.groupName ?? "", required: false })
    );
    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name, required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));
    editor.appendChild(
      createTextAreaArray({ name: "desc[]", title: "Description", value: data.desc, required: false })
    );
    editor.appendChild(
      createTextArray({ name: "short[]", title: "Short Description", value: data.short, required: false })
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
      createTextInput({ name: "savingThrow", title: "Saving Throw", value: data.savingThrow, required: true })
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
    editor.appendChild(createTextInput({ name: "damage", title: "Damage", value: data.damage, required: false }));
    editor.appendChild(
      createTextInput({ name: "damageType", title: "Damage Type/Effect", value: data.damageType, required: false })
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

    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));

    editor.appendChild(createHiddenInput({ name: "type", value: data.type }));
    if (data.id !== undefined) editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    if (data.material === false || data.material === undefined) editor.childNodes[11].childNodes[1].disabled = true;

    editor.childNodes[10].addEventListener("change", function (event) {
      editor.childNodes[11].childNodes[1].disabled = !event.target.checked;
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
        await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.compendiums, settings.game, validateResponse.entry);
        disableSaveButton();
        await updateCategorySelect();
      }
    });

    var deleteButton = document.createElement("button");
    deleteButton.id = "delete-button";
    deleteButton.textContent = "Delete Entry";
    deleteButton.className = "btn";

    deleteButton.addEventListener("click", async function (event) {
      event.preventDefault();
      await StorageHelper.deleteItem(StorageHelper.dbNames.compendiums, settings.game, settings.entry);
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

      if (settings.category === "condition") validateResponse = validateConditionJson(jsonData);

      document.getElementById("compendium-error-wrapper").replaceChildren(...errors);
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
      validateResponse.entry.type = settings.category;
      if (validateResponse.entry.groupName == undefined) validateResponse.entry["groupName"] = "";
      if (validateResponse.entry.source == undefined || validateResponse.entry.source === "")
        validateResponse.entry["source"] = "Unknown";

      validateResponse.entry.names = [validateResponse.entry.name.toLowerCase()];
      if (validateResponse.entry.groupName !== "")
        validateResponse.entry.names.push(validateResponse.entry.groupName.toLowerCase());
    }
    return validateResponse;
  }

  function validateConditionJson(jsonData) {
    var errors = [];
    var conditionUpdate;

    try {
      conditionUpdate = JSON.parse(jsonData);
    } catch (e) {
      errors.push(createErrorMessage("Invalid JSON format. Please correct and try again."));
      errorWrapper.replaceChildren(...errors);
      return { valid: errors.length === 0, errors: errors, entry: conditionUpdate };
    }

    if (conditionUpdate.groupName && typeof conditionUpdate.groupName !== "string")
      errors.push(createErrorMessage("The 'groupName' property must be a string."));

    if (!conditionUpdate.name) errors.push(createErrorMessage("Missing property 'name'"));
    else if (typeof conditionUpdate.name !== "string")
      errors.push(createErrorMessage("The 'name' property must be a string."));
    else if (conditionUpdate.name.trim() === "")
      errors.push(createErrorMessage("The 'name' property cannot be empty."));

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

    return { valid: errors.length === 0, entry: conditionUpdate };
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

  // Generic form fields
  function createSelectInput(data) {
    var group = document.createElement("div");

    var label = document.createElement("label");
    label.setAttribute("for", data.name);
    label.textContent = data.title;

    var select = document.createElement("select");
    select.id = data.name;
    select.name = data.name;
    select.required = data.required || false;

    // default option
    var option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Select --";
    option.style.fontStyle = "italic";
    if (data.value === option.value) option.selected = true;
    select.appendChild(option);

    data.options.forEach((o) => {
      var option = document.createElement("option");
      option.value = o.value;
      option.textContent = o.name;
      if (data.value === o.value) option.selected = true;
      select.appendChild(option);
    });

    group.appendChild(label);
    group.appendChild(select);

    return group;
  }

  function createRadioInput(data) {
    var group = document.createElement("div");
    group.style.display = "flex";

    var input = document.createElement("input");
    input.type = "radio";
    input.id = data.id;
    input.name = data.name;
    input.value = data.id;
    input.checked = data.checked;
    if (data.changeHandler !== undefined) input.addEventListener("change", data.changeHandler);

    var label = document.createElement("label");
    label.setAttribute("for", data.id);
    label.textContent = data.text;
    label.style.padding = "5px 0 0 5px";

    group.appendChild(input);
    group.appendChild(label);
    return group;
  }

  function createTextInput(data) {
    var group = document.createElement("div");
    group.style.marginBottom = "10px";

    var label = document.createElement("label");
    label.setAttribute("for", data.name);
    label.textContent = data.title;

    var input = document.createElement("input");
    input.type = "text";
    input.name = data.name;
    input.required = data.required;
    input.value = data.value ?? "";
    input.style.width = "91%";
    input.autocomplete = "off";

    group.appendChild(label);
    group.appendChild(input);
    return group;
  }

  function createTextAreaInput(data) {
    var group = document.createElement("div");
    group.style.marginBottom = "10px";

    var label = document.createElement("label");
    label.setAttribute("for", data.name);
    label.textContent = data.title;

    var input = document.createElement("textarea");
    input.name = data.name;
    input.required = data.required;
    input.value = data.value ?? "";
    input.style.width = "91%";
    input.style.height = "100px";

    group.appendChild(label);
    group.appendChild(input);
    return group;
  }

  function createCheckboxInput(data) {
    var group = document.createElement("div");

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = data.name;
    input.checked = data.value;
    input.style.marginLeft = "0px";
    input.style.marginRight = "5px";

    var label = document.createElement("label");
    label.setAttribute("for", data.name);
    label.textContent = data.title;
    label.style.padding = "5px 0 0 0px";
    label.style.display = "inline-block";

    group.appendChild(input);
    group.appendChild(label);
    return group;
  }

  function createHiddenInput(data) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = data.name;
    input.value = data.value;

    return input;
  }

  // Text Array Inputs
  function createTextArray(data) {
    var group = document.createElement("div");
    group.style.marginBottom = "20px";

    var label = document.createElement("label");
    label.textContent = data.title;
    group.appendChild(label);

    data.value.forEach((v, i) => {
      group.appendChild(createTextArrayInput(data, v));
    });

    var addBtn = document.createElement("button");
    addBtn.textContent = "Add +";
    addBtn.className = "btn";
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      addBtn.before(createTextArrayInput(data, ""));
    });

    group.appendChild(addBtn);

    return group;
  }

  function createTextArrayInput(data, value) {
    var inputGroup = document.createElement("div");

    var input = document.createElement("input");
    input.type = "text";
    input.name = data.name;
    input.required = data.required;
    input.value = value;
    input.style.width = "91%";
    input.style.marginBottom = "5px";
    inputGroup.appendChild(input);

    var btn = document.createElement("button");
    btn.textContent = "#";
    btn.className = "btn";
    btn.style.fontFamily = "pictos";
    btn.style.marginLeft = "9px";
    inputGroup.appendChild(btn);

    btn.addEventListener("click", function () {
      inputGroup.remove();
      enableSaveButton();
    });

    return inputGroup;
  }

  // Text Area Array Inputs
  function createTextAreaArray(data) {
    var group = document.createElement("div");
    group.style.marginBottom = "20px";

    var label = document.createElement("label");
    label.textContent = data.title;
    group.appendChild(label);

    data.value.forEach((v) => {
      group.appendChild(createTextAreaArrayInput(data, v));
    });

    var addBtn = document.createElement("button");
    addBtn.textContent = "Add +";
    addBtn.className = "btn";
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      addBtn.before(createTextAreaArrayInput(data, ""));
    });

    group.appendChild(addBtn);

    return group;
  }

  function createTextAreaArrayInput(data, value) {
    var inputGroup = document.createElement("div");

    var input = document.createElement("textarea");
    input.name = data.name;
    input.required = data.required;
    input.value = value;
    input.style.width = "91%";
    input.style.marginBottom = "5px";
    input.style.height = "50px";
    inputGroup.appendChild(input);

    var btn = document.createElement("button");
    btn.textContent = "#";
    btn.className = "btn";
    btn.style.fontFamily = "pictos";
    btn.style.marginLeft = "9px";
    btn.style.position = "absolute";
    inputGroup.appendChild(btn);

    btn.addEventListener("click", function () {
      inputGroup.remove();
      enableSaveButton();
    });

    return inputGroup;
  }

  // Advanced Editor
  async function createAdvancedEditor() {
    var group = document.createElement("div");
    group.style.minHeight = "250px";
    group.style.margin = "10px 0 0 15px";
    group.appendChild(await createAdvancedTypeInput());
    group.appendChild(await createAdvancedGameInput());
    group.appendChild(await createAdvancedSubmitButton());

    return group;
  }

  async function createAdvancedTypeInput() {
    var typeSelect = createSelectInput({
      name: "operation",
      title: "Operation",
      options: [
        { name: "Import Compendium", value: "import" },
        { name: "Export Compendium", value: "export" },
        {
          name: "Delete Compendium",
          value: "delete",
        },
      ],
    });

    typeSelect.addEventListener("change", async function (event) {
      settings.advOperation = event.target.value;
      await updateSubmitButton();
    });

    return typeSelect;
  }

  async function createAdvancedGameInput() {
    var group = document.createElement("div");

    var gameLabel = document.createElement("label");
    gameLabel.textContent = "Game";
    gameLabel.setAttribute("for", "advGame");

    var gameInput = document.createElement("input");
    gameInput.name = "advGame";
    gameInput.id = "advGame";
    gameInput.setAttribute("list", "gameOptions");
    gameInput.addEventListener("input", async function (event) {
      settings.advGame = event.target.value;
      await updateSubmitButton();
    });

    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    var datalist = document.createElement("datalist");
    datalist.id = "gameOptions";
    Array.from(games).forEach((x) => {
      var option = document.createElement("option");
      option.value = x;
      datalist.appendChild(option);
    });

    group.appendChild(gameLabel);
    group.appendChild(gameInput);
    group.appendChild(datalist);

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
        btn.disabled = true;
        if (settings.advOperation === "delete") {
          await StorageHelper.deleteObjectStore(StorageHelper.dbNames.compendiums, settings.advGame);
          await updateGameSelect();
        } else if (settings.advOperation === "export") {
          await StorageHelper.exportObjectStore(
            StorageHelper.dbNames.compendiums,
            settings.advGame,
            `c20_compendium_${settings.advGame}.json`
          );
        } else if (settings.advOperation === "import") {
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

            if (item.names === undefined) {
              item["names"] = [item.name.toLowerCase()];

              if (item.groupName !== undefined && item.groupName !== "")
                item["names"].push(item.groupName.toLowerCase());
            }
          });

          await StorageHelper.importObjectStore(StorageHelper.dbNames.compendiums, settings.advGame, jsonData, false);
          await updateGameSelect();
        }
        helper.textContent = "";
      } catch (e) {
        helper.textContent = `Error: ${e}`;
        btn.disabled = false;
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

    if (settings.advGame === "" || settings.advOperation === "") {
      btn.classList.add("hidden");
      helper.textContent = "";
      return;
    }

    btn.classList.remove("hidden");
    var compendiumExists = await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, settings.advGame);

    if (settings.advOperation === "delete") {
      btn.textContent = "Delete";

      if (compendiumExists === true) {
        btn.disabled = false;
        helper.textContent = "*Compendium will be deleted from C20.";
      } else {
        btn.disabled = true;
        helper.textContent = "";
      }
      return;
    }

    if (settings.advOperation === "import") {
      btn.textContent = "Import";
      btn.disabled = false;

      if (compendiumExists === true)
        helper.textContent =
          "*Import new entries into existing compendium\nWill not replace existing entries that match on category and name.";
      else helper.textContent = "*Import into new compendium";
      return;
    }

    if (settings.advOperation === "export") {
      btn.textContent = "Export";
      helper.textContent = "";

      if (compendiumExists === true) btn.disabled = false;
      else btn.disabled = true;
    }
  }

  var CompendiumEditor = {
    show: async function show() {
      await createModal();
    },
  };

  return CompendiumEditor;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return CompendiumEditor;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = CompendiumEditor;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("CompendiumEditor", []).factory("CompendiumEditor", function () {
    return CompendiumEditor;
  });
}
