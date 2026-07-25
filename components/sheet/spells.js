var Spells = (function () {
  let mathParser;

  const defaultFilter = {
    concentration: true,
    material: true,
    prepared: false,
    ritual: false,
    somatic: true,
    time: "",
    verbal: true,
  };

  const spellData = {
    filter: { ...defaultFilter },
  };

  const config = { childList: true, subtree: true };
  let observer;

  function createUi() {
    const page = document.querySelector(".page.spells");
    if (!page) return; // Prevent early boot crashes if template isn't present

    page.classList.add("c20-v2");

    // Scope change listener cleanly
    page.addEventListener("change", function (event) {
      if (!event.target.closest(".spellattackinfo")) return;

      const spellRow = event.target.closest(".spell");
      if (spellRow && typeof updateSpellRow === "function") {
        updateSpellRow(spellRow);
      }
    });

    document.querySelectorAll(".spell-container").forEach((s, i) => {
      if (typeof createSpellHeader === "function") createSpellHeader(s, i);
    });

    document.querySelectorAll(".spell-container .spell > .display > button").forEach((s) => {
      if (typeof createSpellRow === "function") createSpellRow(s);
    });

    document.querySelectorAll(".spell-container .repcontainer .spell").forEach((s) => {
      if (typeof updateSpellRow === "function") updateSpellRow(s);
    });

    // Use roll20 data push to populate spell row data safely
    const flag = document.querySelector(".spell-container .repcontainer .spell .details-flag");
    if (flag !== null) {
      flag.click();
      flag.click();
    }

    // Initialize existing display descriptions using explicit safe string targets
    page.querySelectorAll(".spell .details span[name='attr_spelldescription']").forEach((x) => {
      createDescription(x, "c20-spell-desc");
    });

    page.querySelectorAll(".spell .details span[name='attr_spellathigherlevels']").forEach((x) => {
      createDescription(x, "c20-spell-higher");
    });

    // Populate markdown for initial nodes
    page.querySelectorAll(".repcontainer .spell").forEach((x) => {
      updateDescription(x, "c20-spell-desc", "attr_spelldescription");
    });

    page.querySelectorAll(".repcontainer .spell").forEach((x) => {
      updateDescription(x, "c20-spell-higher", "attr_spellathigherlevels");
    });

    page.addEventListener("change", checkForUpdates);
    serverChangeHandler();
  }

  function createSpellFilter() {
    // Avoid creating duplicate filter containers if init fires multiple times
    if (document.querySelector(".c20-spellFilter")) return;

    const container = document.createElement("div");
    container.className = "c20-spellFilter";

    const btn = document.createElement("div");
    btn.className = "filterBtn";

    const btnImg = document.createElement("img");
    btnImg.src = browser.runtime.getURL(`library/icons/filter-solid-full.svg`);
    btn.appendChild(btnImg);

    btn.addEventListener("click", function () {
      btn.classList.toggle("open");
    });

    container.appendChild(btn);

    const inputContainer = document.createElement("div");
    inputContainer.className = "inputContainer";

    const resetButton = document.createElement("button");
    resetButton.title = "Reset Filters";
    resetButton.textContent = "1";
    resetButton.className = "resetBtn";
    resetButton.addEventListener("click", function () {
      resetFilter(true);
    });

    inputContainer.appendChild(resetButton);

    const selectContainer = document.createElement("div");
    selectContainer.className = "selectContainer";
    selectContainer.appendChild(createSpellFilterSelect("time", "castingtime"));

    const checkBoxContainer = document.createElement("div");
    checkBoxContainer.className = "checkboxContainer";

    const exclusiveContainer = document.createElement("div");
    exclusiveContainer.appendChild(createSpellFilterCheckbox("prepared"));
    exclusiveContainer.appendChild(createSpellFilterCheckbox("ritual"));

    const inclusiveFilter = document.createElement("div");
    inclusiveFilter.style.display = "inline-block";
    inclusiveFilter.appendChild(createSpellFilterCheckbox("verbal"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("somatic"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("material"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("concentration"));

    checkBoxContainer.appendChild(exclusiveContainer);
    checkBoxContainer.appendChild(inclusiveFilter);
    inputContainer.appendChild(checkBoxContainer);
    inputContainer.appendChild(selectContainer);
    container.appendChild(inputContainer);

    const anchorPoint = document.querySelector(".page.spells .col.col1");
    if (anchorPoint) {
      anchorPoint.before(container);
    } else {
      console.warn("[C20] Could not find anchor point '.page.spells .col.col1' to inject layout filter.");
    }
  }

  function createSpellFilterCheckbox(key) {
    const group = document.createElement("div");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `c20-spellFilter-${key}`;
    input.id = `c20-spellFilter-${key}`;
    input.checked = spellData.filter[key];

    const label = document.createElement("label");
    label.textContent = key;
    label.setAttribute("for", `c20-spellFilter-${key}`);
    label.className = "c20-label";

    input.addEventListener("change", function (event) {
      spellData.filter[key] = event.target.checked;
      updateFilter();
      saveState();
    });

    group.appendChild(input);
    group.appendChild(label);

    return group;
  }

  function createSpellFilterSelect(key, attrName) {
    const group = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = key;
    label.setAttribute("for", `c20-spellFilter-${key}`);
    label.className = "c20-label";

    const select = document.createElement("select");
    select.id = `c20-spellFilter-${key}`;
    select.name = `c20-spellFilter-${key}`;
    select.value = spellData.filter[key];
    select.style.width = "auto";

    const options = [{ value: "", text: "Any" }];

    document.querySelectorAll(`.spell .details [name="attr_spell${attrName}"]`).forEach((el) => {
      const textVal = el.textContent?.trim().toLowerCase();
      if (textVal && !options.some((o) => o.value === textVal)) {
        options.push({ value: textVal, text: el.textContent });
      }
    });

    options.forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.text;
      if (option.value === spellData.filter[key]) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", function (event) {
      spellData.filter[key] = event.target.value;
      updateFilter();
      saveState();
    });

    group.appendChild(label);
    group.appendChild(select);

    return group;
  }

  function updateFilter() {
    // spell sheet filter loops
    document.querySelectorAll(".spell-container > .repcontainer .spell").forEach((spell) => {
      const prepBoxChecked = spell.querySelector(".display .prep-box")?.checked ?? true;
      const vVal = spell.querySelector(".display input.v")?.value || "0";
      const sVal = spell.querySelector(".display input.s")?.value || "0";
      const mVal = spell.querySelector(".display input.m")?.value || "0";
      const concVal = spell.querySelector(".display input.spellconcentration")?.value || "0";
      const ritVal = spell.querySelector(".display input.spellritual")?.value || "0";
      const castTimeText =
        spell.querySelector(`.details span[name="attr_spellcastingtime"]`)?.textContent?.toLowerCase() || "";

      if (spellData.filter.prepared === true && !prepBoxChecked) {
        spell.classList.add("hidden");
      } else if (spellData.filter.verbal === false && vVal !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.somatic === false && sVal !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.material === false && mVal !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.concentration === false && concVal !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.ritual === true && ritVal === "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.time !== "" && castTimeText !== spellData.filter.time) {
        spell.classList.add("hidden");
      } else {
        spell.classList.remove("hidden");
      }
    });

    // core attacks & spell casting sub-filters
    document.querySelectorAll(".attacks > .repcontainer > .repitem").forEach((attack) => {
      const spellIdInput = attack.querySelector(`input[name="attr_spellid"]`);
      if (!spellIdInput) return;

      const spellId = spellIdInput.value;
      const matchingHiddenSpell = document.querySelector(
        `.spell-container .repitem[data-reprowid="${spellId}"] .spell.hidden`,
      );
      if (matchingHiddenSpell) {
        attack.classList.add("hidden");
      } else {
        attack.classList.remove("hidden");
      }
    });

    // filter button layout manager updates
    const isDefault = Object.keys(defaultFilter).every((key) => defaultFilter[key] === spellData.filter[key]);
    const filterBtnClassList = document.querySelector(".c20-spellFilter .filterBtn")?.classList;

    if (isDefault) {
      filterBtnClassList?.remove("active");
    } else {
      filterBtnClassList?.add("active");
    }
  }

  function resetFilter(save) {
    spellData.filter = { ...defaultFilter };
    updateFilter();

    if (save === true) {
      const timeInput = document.querySelector('.c20-spellFilter [name="c20-spellFilter-time"]');
      if (timeInput) timeInput.value = spellData.filter.time;

      const filterKeys = ["prepared", "ritual", "verbal", "somatic", "material", "concentration"];
      filterKeys.forEach((key) => {
        const checkbox = document.querySelector(`.c20-spellFilter [name="c20-spellFilter-${key}"]`);
        if (checkbox) checkbox.checked = spellData.filter[key];
      });

      saveState();
    }
  }

  function createSpellHeader(container) {
    if (!container || container.querySelector(".c20-spellHeader")) return;

    const header = document.createElement("div");
    header.className = "c20-spellHeader";

    const fields = ["Name", "Time", "Range", "Duration", "Save", "Roll", "Effect"];
    const classes = [
      "spellName",
      "spellTime",
      "spellRange",
      "spellDuration",
      "spellSavingThrow",
      "spellRoll",
      "spellEffect",
    ];

    fields.forEach((text, index) => {
      const col = document.createElement("div");
      col.className = classes[index];
      col.textContent = text;
      header.appendChild(col);
    });

    container.insertBefore(header, container.firstChild);
  }

  function createSpellRow(container) {
    if (!container || container.querySelector(".c20-spellRow")) return;

    const row = document.createElement("div");
    row.className = "c20-spellRow";

    const classes = ["spellTime", "spellRange", "spellDuration", "spellSavingThrow", "spellRoll", "spellEffect"];
    const attrNames = [
      "attr_spellcastingtime",
      "attr_spellrange",
      "attr_spellduration",
      "",
      "",
      "attr_spelldamagetype",
    ];

    classes.forEach((cls, index) => {
      const span = document.createElement("span");
      span.className = cls;
      if (attrNames[index]) span.setAttribute("name", attrNames[index]);
      row.appendChild(span);
    });

    container.appendChild(row);
  }

  function updateSpellRow(spell) {
    if (!spell) return;

    const row = spell.querySelector(".display .c20-spellRow");
    const info = spell.querySelector(".wrapper > .options > .spellattackinfo");
    if (!row || !info) return;

    // FIXED: Upgraded targets with optional chaining to prevent layout crash locks
    const data = {
      damageRoll: info.querySelector("[name='attr_spelldamage']")?.value || "",
      healingRoll: info.querySelector("[name='attr_spellhealing']")?.value || "",
      savingThrow: info.querySelector("[name='attr_spellsave']")?.value || "",
      spellAttack: info.querySelector("[name='attr_spellattack']")?.value || "None",
      addModifier: info.querySelector("[name='attr_spelldmgmod']")?.checked || false,
    };

    const rollDisplay = row.querySelector(".spellRoll");
    const saveDisplay = row.querySelector(".spellSavingThrow");

    if (rollDisplay) {
      if (data.damageRoll) {
        rollDisplay.textContent = getDiceRoll(data.damageRoll, data.addModifier);
      } else if (data.healingRoll) {
        rollDisplay.textContent = getDiceRoll(data.healingRoll, data.addModifier);
      } else {
        rollDisplay.textContent = "";
      }
    }

    if (saveDisplay) {
      if (data.savingThrow) {
        saveDisplay.textContent = data.savingThrow.substring(0, 3);
      } else if (data.spellAttack !== "None") {
        saveDisplay.textContent = "AC";
      } else {
        saveDisplay.textContent = "";
      }
    }
  }

  function getDiceRoll(value, addModifier) {
    if (!value) return "";

    if (addModifier) {
      const castingAbilityInput = document.querySelector("[name='attr_spellcasting_ability']");
      const abilityValue = castingAbilityInput?.value || "";
      if (abilityValue) {
        value = `${value} + ${abilityValue.slice(0, -1)}`;
      }
    }

    value = value.replace(/\@\{(.*?)\}/g, (_, expression) => {
      const targetInput = document.querySelector(`.charactersheet > input[name='attr_${expression}']`);
      return targetInput?.value || "0";
    });

    return value.replace(/\s/g, "").replace(/\[\[(.*?)\]\]/g, (match, expression) => {
      try {
        if (!mathParser) return match;
        const result = mathParser.evaluate(expression);
        return result !== null && result !== undefined ? String(result) : match;
      } catch (e) {
        return match; // Safe layout boundary fallback
      }
    });
  }

  function checkForUpdates(event) {
    if (!event?.target) return;
    const attrName = event.target.getAttribute("name");

    if (attrName === "attr_spelldescription") {
      const spellContainer = event.target.closest(".spell");
      if (spellContainer) updateDescription(spellContainer, "c20-spell-desc", "attr_spelldescription");
    } else if (attrName === "attr_spellathigherlevels") {
      const spellContainer = event.target.closest(".spell");
      if (spellContainer) updateDescription(spellContainer, "c20-spell-higher", "attr_spellathigherlevels");
    }
  }

  function createDescription(container, className) {
    if (!container || !className) return null;

    const existingElement = container.querySelector(`.${className}`);
    if (existingElement) return existingElement;

    const span = document.createElement("span");
    span.className = className;
    container.after(span);
    return span;
  }

  function updateDescription(container, className, attrName) {
    if (!container || !className || !attrName) return;

    const inputEl = container.querySelector(`.options [name="${attrName}"]`);
    if (!inputEl) return;

    const displayContainer = container.querySelector(".details");
    if (!displayContainer) return;

    let descSpan = displayContainer.querySelector(`.${className}`);
    if (!descSpan) {
      descSpan = createDescription(displayContainer, className);
    }

    if (!descSpan) return;

    if (typeof createMarkdownDisplay === "function") {
      descSpan.classList.add("c20-rendering-lock");

      const markdownNode = createMarkdownDisplay(inputEl.value || "");
      descSpan.replaceChildren(markdownNode);

      descSpan.classList.remove("c20-rendering-lock");
    }
  }

  function serverChangeHandler() {
    const targetNode = document.querySelector(".page.spells.c20-v2");
    if (!targetNode) return;

    observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.target.classList.contains("c20-rendering-lock")) continue;

        if (mutation.target.classList.contains("repcontainer")) {
          if (mutation.target.classList.contains("ui-sortable")) {
            const firstAdded = mutation.addedNodes?.[0];
            const firstRemoved = mutation.removedNodes?.[0];

            if (firstAdded && firstAdded.nodeType === 1 && firstAdded.classList.contains("repitem")) {
              const spellNode = firstAdded.querySelector(".spell");
              if (spellNode) {
                if (typeof updateSpellRow === "function") updateSpellRow(spellNode);
                updateDescription(spellNode, "c20-spell-desc", "attr_spelldescription");
                updateDescription(spellNode, "c20-spell-higher", "attr_spellathigherlevels");
              }
            } else if (firstRemoved && firstRemoved.nodeType === 1 && firstRemoved.classList.contains("repitem")) {
              // Lock down listener loops safely within target structures cleanly
              mutation.target.querySelectorAll(".spell").forEach((x) => {
                if (typeof updateSpellRow === "function") updateSpellRow(x);
              });
            }
          }
        }
      }
    });

    observer.observe(targetNode, config);
  }

  async function saveState() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, spellData, "spells");
  }

  async function loadState() {
    const storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "spells");
    if (storedData !== undefined && storedData.filter) {
      Object.keys(defaultFilter).forEach((key) => {
        if (storedData.filter[key] === undefined) {
          storedData.filter[key] = defaultFilter[key];
        }
      });
      spellData.filter = storedData.filter;
    }
  }

  const Spells = {
    initFilter: async function initFilter() {
      await loadState();
      createSpellFilter();
      updateFilter();
    },
    initUi: async function initUi() {
      if (typeof exprEval !== "undefined" && exprEval.Parser) {
        mathParser = new exprEval.Parser();
      }
      createUi();
    },
    removeFilter: function removeFilter() {
      resetFilter(false);
      document.querySelector(".c20-spellFilter")?.remove();
    },
    removeUi: function removeUi() {
      const page = document.querySelector(".page.spells");
      if (page) page.classList.remove("c20-v2");

      document.querySelectorAll(".c20-spellHeader").forEach((el) => el.remove());
      document.querySelectorAll(".c20-spellRow").forEach((el) => el.remove());

      if (observer) observer.disconnect();
    },
    updateSpellRow: updateSpellRow,
  };

  return Spells;
})();
