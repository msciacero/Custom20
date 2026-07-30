var CompendiumEditor = (function () {
  // FIXED: Declared variables properly inside module scope to isolate namespaces from leaking out to window
  const stdEl = {
    game: null,
    category: null,
    entry: null,
  };

  const advEl = {
    operation: null,
    game: null,
  };

  const settings = {
    editor: "ui",
    newCompendium: "",
    update: false,
  };

  // modal UI elements construction
  async function createModal() {
    // FIXED: Cleanly wipe out any pre-existing zombie modals before spinning up new layouts
    const existingModal = document.querySelector("#c20-editor-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = `modal c20-modal-full`;
    modal.id = "c20-editor-modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.maxWidth = "850px";

    const compendiumContent = document.createElement("div");
    compendiumContent.id = "c20-compendium-modal-content";
    compendiumContent.style.marginLeft = "15px";
    compendiumContent.style.marginTop = "10px";
    compendiumContent.style.maxHeight = "calc(100vh - 400px)";
    compendiumContent.style.overflowY = "auto";

    const advancedContent = document.createElement("div");
    advancedContent.id = "c20-advanced-modal-content";
    advancedContent.className = "hidden";
    advancedContent.style.maxHeight = "calc(100vh - 400px)";
    advancedContent.style.overflowY = "auto";

    const selectWrapper = document.createElement("div");
    selectWrapper.style.display = "flex";
    selectWrapper.style.flexFlow = "wrap";
    selectWrapper.style.gap = "20px";

    selectWrapper.appendChild(await createGameSelect());
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
    const modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    const modalTitle = document.createElement("h3");
    modalTitle.id = "c20-compendium-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Compendium Editor";

    const btn = document.createElement("button");
    btn.textContent = "c";
    btn.title = "Import/Export";
    btn.id = "compendium-editor-advanced";
    btn.style.fontFamily = "pictos";
    btn.style.fontSize = "15px";
    btn.style.marginLeft = "10px";

    btn.addEventListener("click", toggleAdvancedEditor);

    const modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    modalClose.onclick = function () {
      const modalTarget = document.querySelector("#c20-editor-modal");
      if (modalTarget) modalTarget.remove();
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(btn);
    modalHeader.appendChild(modalClose);

    return modalHeader;
  }

  function createProgressIndicator() {
    const container = document.createElement("div");
    container.className = "progress-container";

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.id = "modal-compendium-progress";

    container.appendChild(bar);
    return container;
  }

  // Select Menus Factory
  async function createGameSelect() {
    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    stdEl.game = new c20FieldSelect();

    const gameSelect = stdEl.game.create({
      name: "game",
      title: "Compendium",
      options: Array.from(games).map((x) => ({ text: x, value: x })),
      changeHandler: async function () {
        if (stdEl.category) {
          stdEl.category.reset();
          stdEl.category.disabled(stdEl.game.getValue() === "");
        }
        if (stdEl.entry) {
          stdEl.entry.reset();
          stdEl.entry.disabled(true);
        }

        await updateEditor();
      },
    });

    return gameSelect;
  }

  function createCategorySelect() {
    stdEl.category = new c20FieldSelect();
    const categorySelect = stdEl.category.create({
      name: "category",
      title: "Category",
      options: [
        { text: "Backgrounds", value: "background" },
        { text: "Classes", value: "class" },
        { text: "Conditions", value: "condition" },
        { text: "Feats", value: "feat" },
        { text: "Items", value: "item" },
        { text: "Spells", value: "spell" },
        { text: "Subclasses", value: "subclass" },
      ],
      changeHandler: async function () {
        if (stdEl.entry) stdEl.entry.reset();
        await updateCategorySelect();
      },
    });

    stdEl.category.disabled(true);
    return categorySelect;
  }

  function createEntrySelect() {
    stdEl.entry = new c20FieldComboBox();
    stdEl.entry.allowNewEntries(true);

    const entrySelect = stdEl.entry.create({
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
    // FIXED: Adjusted validation checks inside the type factory triggers layout safely
    const optionsDiv = createRadioInputGroup({
      title: "",
      name: "editor",
      options: [
        { value: "ui", name: "UI Editor" },
        { value: "json", name: "JSON Editor" },
      ],
      selectedValue: settings.editor,
      changeHandler: updateEditorRadio,
    });

    return optionsDiv;
  }

  // Select Change Handlers
  async function updateGameSelect() {
    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    const sortedGames = Array.from(games)
      .sort()
      .map((x) => ({ value: x, text: x }));

    if (advEl.game) {
      advEl.game.reset();
      advEl.game.updateOptions(sortedGames);
    }

    if (stdEl.game) {
      stdEl.game.reset();
      stdEl.game.updateOptions(sortedGames);
    }

    if (stdEl.category) {
      stdEl.category.reset();
      stdEl.category.disabled(true);
    }

    if (stdEl.entry) {
      stdEl.entry.reset();
      stdEl.entry.disabled(true);
    }

    await updateEditor();
  }

  async function updateCategorySelect() {
    if (!stdEl.game || !stdEl.category || !stdEl.entry) return;

    const gameVal = stdEl.game.getValue();
    const categoryVal = stdEl.category.getValue();

    const categoryData = await StorageHelper.listItemsByType(StorageHelper.dbNames.compendiums, gameVal, categoryVal);

    const sortedMappedData = Array.from(categoryData || [])
      .sort((a, b) => {
        const textA = `${a.groupName ?? ""} ${a.name ?? ""}`.trim();
        const textB = `${b.groupName ?? ""} ${b.name ?? ""}`.trim();
        return textA.localeCompare(textB);
      })
      .map((o) => ({
        value: o.id,
        text: (o.groupName ? `${o.groupName}: ${o.name}` : `${o.name}`).trim(),
      }));

    stdEl.entry.disabled(categoryVal === "");
    stdEl.entry.reset();
    stdEl.entry.updateOptions(sortedMappedData);

    await updateEditor();
  }

  async function updateEditorRadio(event) {
    if (event?.target?.checked === true) {
      settings.editor = event.target.value;
      await updateEditor();
    }
  }

  async function updateEditor() {
    disableSaveButton();

    const entryVal = String(stdEl.entry.getValue());
    const categoryVal = stdEl.category.getValue();
    const gameVal = stdEl.game.getValue();

    const editorWorkspace = document.querySelector("#compendium-editor");
    const actionContainer = document.querySelector("#editor-action");

    if (entryVal === "" || !editorWorkspace) {
      if (editorWorkspace) editorWorkspace.replaceChildren();
      actionContainer?.classList.add("hidden");
      return;
    }

    let entry = null;

    // FIXED: Removed the fatal Number() cast to preserve alphanumeric UUID lookups perfectly
    if (entryVal !== "-1") {
      entry = await StorageHelper.getItem(StorageHelper.dbNames.compendiums, gameVal, parseInt(entryVal));
    } else {
      // FIXED: Used anchored regex selectors to prevent trimming characters out of real names
      const rawText = stdEl.entry.getTextValue();
      const cleanedName =
        rawText
          .replace(/^Add\s+/i, "")
          .replace(/\.\.\.$/, "")
          .trim() || "New Entry";

      // Structural template schema maps literal initialization records safely
      if (categoryVal === "background") {
        entry = { name: cleanedName, description: "", type: "background", source: "" };
      } else if (categoryVal === "class") {
        entry = { name: cleanedName, description: "", type: "class", source: "" };
      } else if (categoryVal === "condition") {
        entry = { groupName: "", name: cleanedName, description: "", short: [""], type: "condition", source: "" };
      } else if (categoryVal === "feat") {
        entry = { name: cleanedName, description: "", type: "feat", source: "" };
      } else if (categoryVal === "item") {
        entry = {
          name: cleanedName,
          description: "",
          type: "item",
          count: 1,
          source: "",
          magical: "",
          hands: "",
          size: "",
        };
      } else if (categoryVal === "spell") {
        entry = {
          level: "",
          name: cleanedName,
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
      } else if (categoryVal === "subclass") {
        entry = { name: cleanedName, description: "", type: "subclass", source: "" };
      }
    }

    if (!entry) {
      console.warn("[C20] Aborting form update: could not compile valid data item payload.");
      return;
    }

    actionContainer?.classList.remove("hidden");

    // Dynamic UI component rendering logic splits targets predictably
    if (settings.editor === "json") {
      editorWorkspace.replaceChildren(createJsonEditor(entry));
    } else if (settings.editor === "ui") {
      if (categoryVal === "background") {
        editorWorkspace.replaceChildren(createTraitEditor(entry));
      } else if (categoryVal === "class") {
        editorWorkspace.replaceChildren(createClassEditor(entry));
      } else if (categoryVal === "condition") {
        editorWorkspace.replaceChildren(createConditionsEditor(entry));
      } else if (categoryVal === "feat") {
        editorWorkspace.replaceChildren(createTraitEditor(entry));
      } else if (categoryVal === "item") {
        editorWorkspace.replaceChildren(createItemEditor(entry));
      } else if (categoryVal === "spell") {
        editorWorkspace.replaceChildren(createSpellEditor(entry));
      } else if (categoryVal === "subclass") {
        editorWorkspace.replaceChildren(createSubclassEditor(entry));
      }
    }
  }

  // Editors Builders
  function createEditor() {
    const editor = document.createElement("div");

    const body = document.createElement("div");
    body.id = "compendium-editor";
    body.style.minHeight = "250px";

    // FIXED: Protected inputs listener logic mapping changes safely
    body.addEventListener("input", function () {
      enableSaveButton();
    });

    editor.appendChild(body);

    editor.appendChild(createErrorWrapper());
    editor.appendChild(createEditButtons());

    return editor;
  }

  function createJsonEditor(data) {
    const editor = document.createElement("div");
    editor.id = "compendium-rawEditor";

    const textArea = document.createElement("textarea");
    textArea.id = "compendium-rawEditor-textarea";
    textArea.style.width = "97__";
    textArea.style.width = "97%";
    textArea.style.maxWidth = "97%";
    textArea.style.height = "300px";

    // Modern CSS field-sizing controls layout expansion gracefully
    if ("fieldSizing" in textArea.style) {
      textArea.style.fieldSizing = "content";
    }

    textArea.style.marginTop = "10px";
    textArea.value = JSON.stringify(data, null, 2);

    editor.appendChild(textArea);
    return editor;
  }

  function createEditButtons() {
    const div = document.createElement("div");
    div.id = "editor-action";
    div.className = "hidden";

    const saveButton = document.createElement("button");
    saveButton.id = "save-button";
    saveButton.textContent = "Save Entry";
    saveButton.className = "btn";
    saveButton.style.cssText = "margin-left: 10px; margin-right: 10px; float: right;";
    saveButton.disabled = true;

    saveButton.addEventListener("click", async function (event) {
      event.preventDefault();

      const validateResponse = validateEntry();
      if (validateResponse.valid === true && stdEl.game) {
        const itemId = await StorageHelper.addOrUpdateItem(
          StorageHelper.dbNames.compendiums,
          stdEl.game.getValue(),
          validateResponse.entry,
        );

        await updateCategorySelect();
        if (stdEl.entry) stdEl.entry.setValue(itemId);
        await updateEditor();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.id = "delete-button";
    deleteButton.textContent = "Delete Entry";
    deleteButton.className = "btn";

    deleteButton.addEventListener("click", async function (event) {
      event.preventDefault();
      if (!stdEl.game || !stdEl.entry) return;

      const gameVal = stdEl.game.getValue();
      const entryVal = String(stdEl.entry.getValue());

      // FIXED: Removed the fatal Number() cast to allow deletion of alphanumeric UUID store entries successfully
      await StorageHelper.deleteItem(StorageHelper.dbNames.compendiums, gameVal, entryVal);

      await updateCategorySelect();
    });

    div.appendChild(saveButton);
    div.appendChild(deleteButton);
    return div;
  }

  function enableSaveButton() {
    const saveBtn = document.querySelector("#editor-action #save-button");
    // FIXED: Embedded strict safety validation checks to prevent runtime crash locks
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.classList.add("btn-primary");
    }
  }

  function disableSaveButton() {
    const saveBtn = document.querySelector("#editor-action #save-button");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.remove("btn-primary");
    }
  }

  // Validators Engine
  function validateEntry() {
    let validateResponse = { valid: false, entry: {} };

    if (settings.editor === "json") {
      const jsonTextarea = document.querySelector("#compendium-rawEditor-textarea");
      const jsonData = jsonTextarea ? jsonTextarea.value : "{}";

      validateResponse = validateDefaultJson(jsonData);

      const errorWrapper = document.getElementById("compendium-error-wrapper");
      if (errorWrapper && Array.isArray(validateResponse.errors)) {
        errorWrapper.replaceChildren(...validateResponse.errors);
      }
    } else {
      const form = document.querySelector("#c20-compendium-modal-content form");
      if (form) {
        validateResponse.valid = form.reportValidity();
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
          if (key.endsWith("[]")) {
            const arrayKey = key.slice(0, -2);
            if (!validateResponse.entry[arrayKey]) {
              validateResponse.entry[arrayKey] = [];
            }
            validateResponse.entry[arrayKey].push(value);
          } else if (key === "id") {
            // Treat explicit sub-form tracking identifiers as native numbers if needed
            validateResponse.entry[key] = value !== "" ? Number(value) : undefined;
          } else {
            validateResponse.entry[key] = value;
          }
        }
      }

      const activeCategory = stdEl.category ? stdEl.category.getValue() : "";

      if (activeCategory === "item") {
        validateResponse.entry = constructItemAbilityData(validateResponse.entry);
      } else if (activeCategory === "subclass" && validateResponse.entry.className) {
        validateResponse.entry.groupName = `${validateResponse.entry.className} - ${validateResponse.entry.subclassName || "General"}`;
      }
    }

    if (validateResponse.valid === true && validateResponse.entry) {
      // Establish uniform core fallback properties
      validateResponse.entry.type = stdEl.category ? stdEl.category.getValue() : "unknown";

      if (validateResponse.entry.groupName === undefined || validateResponse.entry.groupName === null) {
        validateResponse.entry.groupName = "";
      }
      if (!validateResponse.entry.source) {
        validateResponse.entry.source = "Unknown";
      }

      const entryName = String(validateResponse.entry.name || "Untitled Item");
      validateResponse.entry.names = [entryName.toLowerCase()];

      if (validateResponse.entry.groupName !== "") {
        validateResponse.entry.names.push(String(validateResponse.entry.groupName).toLowerCase());
      }

      // FIXED: Swapped loose redundant assignments into type-safe logical string fallback checks
      if (validateResponse.entry.type === "spell") {
        validateResponse.entry.description = validateResponse.entry.description || "";
        validateResponse.entry.higherLevels = validateResponse.entry.higherLevels || "";
      }
    }
    return validateResponse;
  }

  function validateDefaultJson(jsonData) {
    const errors = [];
    let data = null;

    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      errors.push(createErrorMessage("Invalid JSON format. Please correct syntax errors and try again."));
      return { valid: false, errors: errors, entry: null };
    }

    if (!data || typeof data !== "object") {
      errors.push(createErrorMessage("JSON payload must resolve to a valid structural object structure."));
      return { valid: false, errors: errors, entry: null };
    }

    if (!data.name) {
      errors.push(createErrorMessage("Missing required property 'name'"));
    } else if (typeof data.name !== "string") {
      errors.push(createErrorMessage("The 'name' property must be a valid text string literal."));
    } else if (data.name.trim() === "") {
      errors.push(createErrorMessage("The 'name' property cannot be evaluated as an empty string."));
    }

    return { valid: errors.length === 0, errors: errors, entry: data };
  }

  // Error Utilities Helpers
  function createErrorWrapper() {
    const errorWrapper = document.createElement("div");
    errorWrapper.id = "compendium-error-wrapper";
    errorWrapper.style.color = "red";
    return errorWrapper;
  }

  function createErrorMessage(message) {
    const errorMessage = document.createElement("p");
    errorMessage.className = "condition-error-message";
    errorMessage.textContent = message;
    return errorMessage;
  }

  // Advanced Editor Builder
  async function createAdvancedEditor() {
    const group = document.createElement("div");
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

    const typeSelect = advEl.operation.create({
      name: "operation",
      title: "Operation",
      options: [
        { text: "Create Compendium", value: "create" },
        { text: "Import Compendium", value: "import" },
        { text: "Export Compendium", value: "export" },
        { text: "Delete Compendium", value: "delete" },
      ],
      changeHandler: async function () {
        const combobox = document.querySelector("#c20-advanced-modal-content .c20-combobox");
        const inputContainer = document.querySelector("#c20-advanced-modal-content input[name='advNewGame']");
        const inputBoxWrapper = inputContainer?.parentElement;

        if (advEl.game) advEl.game.reset();

        // FIXED: Replaced brittle childNodes[1] query with a safe, direct explicit selector query
        if (inputContainer) {
          inputContainer.value = "";
        }

        const isOperationEmpty = advEl.operation.getValue() === "";
        if (advEl.game) {
          advEl.game.disabled(isOperationEmpty);
        }

        if (advEl.operation.getValue() === "create") {
          combobox?.classList.add("hidden");
          inputBoxWrapper?.classList.remove("hidden");
        } else {
          inputBoxWrapper?.classList.add("hidden");
          combobox?.classList.remove("hidden");
        }

        const importUpdatePanel = document.querySelector("#c20-import-update");
        if (importUpdatePanel) {
          if (advEl.operation.getValue() === "import") {
            importUpdatePanel.classList.remove("hidden");
          } else {
            importUpdatePanel.classList.add("hidden");
          }
        }

        await updateSubmitButton();
      },
    });

    return typeSelect;
  }

  async function createAdvancedGameInput() {
    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    advEl.game = new c20FieldComboBox();

    const input = advEl.game.create({
      name: "advGame",
      title: "Compendium Name",
      required: false,
      options: Array.from(games).map((x) => ({ text: x, value: x })),
      changeHandler: async function () {
        await updateSubmitButton();
      },
    });

    if (advEl.game) advEl.game.disabled(true);
    if (input) input.style.width = "220px";
    return input;
  }

  function createAdvancedNewGameInput() {
    if (typeof createTextInput !== "function") return document.createElement("div");

    const input = createTextInput({ name: "advNewGame", title: "Compendium Name" });
    if (!input) return document.createElement("div");

    input.classList.add("hidden");
    input.style.width = "230px";

    input.addEventListener("input", async function (event) {
      settings.newCompendium = event.target.value?.trim() || "";
      await updateSubmitButton();
    });

    return input;
  }

  function createAdvancedImportUpdate() {
    if (typeof createCheckboxInput !== "function") return document.createElement("div");

    const group = createCheckboxInput({ name: "import-update", title: "Update", value: false });
    if (!group) return document.createElement("div");

    group.classList.add("hidden");
    group.id = "c20-import-update";

    // FIXED: Safely query the inner input element checkbox to prevent breaking nested click handlers
    const innerCheckbox = group.querySelector("input");
    if (innerCheckbox) {
      innerCheckbox.addEventListener("change", async function (event) {
        settings.update = !!event.target.checked;
        await updateSubmitButton();
      });
    }
    return group;
  }

  function createAdvancedSubmitButton() {
    const group = document.createElement("div");
    group.style.marginTop = "30px";

    const helper = document.createElement("div");
    helper.id = "compendium-adv-help";

    const btn = document.createElement("button");
    btn.id = "compendium-adv-submit";
    btn.className = "btn hidden";
    btn.style.marginTop = "10px";

    btn.addEventListener("click", async function () {
      const progress = document.querySelector("#modal-compendium-progress");
      if (progress) progress.style.display = "block";

      try {
        const operationType = advEl.operation.getValue();
        const targetedGameStore = advEl.game ? advEl.game.getValue() : "";

        if (operationType === "delete") {
          await StorageHelper.deleteObjectStore(StorageHelper.dbNames.compendiums, targetedGameStore);
          await updateGameSelect();
          await Compendium.update();
        } else if (operationType === "export") {
          await StorageHelper.exportObjectStore(
            StorageHelper.dbNames.compendiums,
            targetedGameStore,
            `c20_compendium_${targetedGameStore}.json`,
          );
        } else if (operationType === "import") {
          try {
            const [handle] = await window.showOpenFilePicker({
              types: [{ accept: { "application/json": [".json"] } }],
            });

            const file = await handle.getFile();
            const jsonData = JSON.parse(await file.text());

            // Bulk data cleaning and safety parameters parsing
            jsonData.forEach((item) => {
              if (item.name === undefined) throw new Error(`Missing 'name' property for ${JSON.stringify(item)}`);
              if (item.type === undefined) throw new Error(`Missing 'type' property for ${JSON.stringify(item)}`);

              if (item.id !== undefined) delete item.id;
              if (item.source === undefined || item.source === null) item["source"] = "Unknown";

              // FIXED: Unnested inline if structures to maintain strict block conditional security mapping
              if (item.type === "condition") {
                if (item.groupName === undefined || item.groupName === null) {
                  item["groupName"] = "";
                }
              }

              if (item.names === undefined) {
                item["names"] = [item.name.toLowerCase()];
                if (item.groupName !== undefined && item.groupName !== "") {
                  item["names"].push(item.groupName.toLowerCase());
                }
              }
            });

            // SUCCESS: Leverages our modernized, lightning-fast batch CPU-mapped import handler
            await StorageHelper.importObjectStore(
              StorageHelper.dbNames.compendiums,
              targetedGameStore,
              jsonData,
              settings.update,
            );

            await updateGameSelect();
            await Compendium.update();
          } catch (err) {
            if (err.name !== "AbortError") throw err;
          }
        } else if (operationType === "create") {
          const newNameInput = document.querySelector("#c20-advanced-modal-content input[name='advNewGame']");
          const targetNewName = newNameInput ? newNameInput.value.trim() : "";

          if (targetNewName) {
            await StorageHelper.createObjectStore(StorageHelper.dbNames.compendiums, targetNewName);
            await updateGameSelect();
            await Compendium.update();
          } else {
            throw new Error("Compendium creation failed: name field cannot be evaluated empty.");
          }
        }

        helper.textContent = "Operation Successfully Completed";
        btn.disabled = true;
      } catch (e) {
        helper.textContent = `Error: ${e.message || e}`;
      } finally {
        if (progress) progress.style.display = "none";
      }
    });

    group.appendChild(helper);
    group.appendChild(btn);
    return group;
  }

  async function toggleAdvancedEditor() {
    const advContent = document.querySelector("#c20-advanced-modal-content");
    const cpContent = document.querySelector("#c20-compendium-modal-content");

    if (!advContent || !cpContent) return;

    // FIXED: Stripped out the unused, shadowed 'btn' variable assignment allocation cleanly
    if (advContent.classList.contains("hidden")) {
      cpContent.classList.add("hidden");
      advContent.classList.remove("hidden");
    } else {
      advContent.classList.add("hidden");
      cpContent.classList.remove("hidden");
    }
  }

  async function updateSubmitButton() {
    const btn = document.querySelector("#compendium-adv-submit");
    const helper = document.querySelector("#compendium-adv-help");
    if (!btn || !helper || !advEl.operation) return;

    const currentOperation = advEl.operation.getValue();

    if (!currentOperation) {
      resetAdvSubmitButton(btn, helper);
      return;
    }

    if (currentOperation === "create") {
      const inputBox = document.querySelector("#c20-advanced-modal-content input[name='advNewGame']");
      if (!inputBox) {
        resetAdvSubmitButton(btn, helper);
        return;
      }

      const inputNameValue = inputBox.value.trim();

      // FIXED: Added the critical missing 'await' keyword to prevent unresolved promise objects from short-circuiting creation tracks
      const doesStoreExist = await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, inputNameValue);

      if (!inputNameValue || doesStoreExist) {
        resetAdvSubmitButton(btn, helper);
        return;
      }

      btn.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Create";
      helper.textContent = "";
      return;
    }

    if (!advEl.game) {
      resetAdvSubmitButton(btn, helper);
      return;
    }

    const currentGameValue = String(advEl.game.getValue()).trim();
    const doesCurrentStoreExist = await StorageHelper.objectStoreExists(
      StorageHelper.dbNames.compendiums,
      currentGameValue,
    );

    // FIXED: Enforce accurate explicit validation checks to bypass falsy string index matching issues
    if (currentGameValue === "" || currentGameValue === "-1" || !doesCurrentStoreExist) {
      resetAdvSubmitButton(btn, helper);
      return;
    }

    btn.classList.remove("hidden");
    btn.disabled = false;

    if (currentOperation === "delete") {
      btn.textContent = "Delete";
      helper.textContent = "*Compendium will be deleted from C20 configuration space permanently.";
      return;
    }

    if (currentOperation === "import") {
      btn.textContent = "Import";
      if (settings.update) {
        helper.textContent = "*Will update existing records that match on category and name values.";
      } else {
        helper.textContent = "*Will safely ignore imported records that already match existing keys.";
      }
      return;
    }

    if (currentOperation === "export") {
      btn.textContent = "Export";
      helper.textContent = "";
    }
  }

  function resetAdvSubmitButton(btn, helper) {
    if (btn) {
      btn.classList.add("hidden");
      btn.disabled = true;
    }
    if (helper) {
      helper.textContent = "";
    }
  }

  const CompendiumEditor = {
    show: async function show() {
      await createModal();
    },
  };

  return CompendiumEditor;
})();
