var Compendium = (function () {
  const dragList = ["background", "class", "feat", "item", "spell", "subclass"];
  const settings = {
    origin: "",
    game: "",
    isDragging: false,
  };

  const pluralName = {
    background: "backgrounds",
    class: "classes",
    condition: "conditions",
    feat: "feats",
    item: "items",
    spell: "spells",
    subclass: "subclasses",
  };

  async function createUi() {
    const connector = document.querySelector("#vm_compendium_panel");
    if (!connector) {
      console.warn("[C20] Aborting compendium boot: '#vm_compendium_panel' node missing.");
      return;
    }

    connector.style.overflowY = "hidden";

    // Prevent duplicate menu appending if method re-fires
    if (!document.querySelector(".c20-compendium-menu")) {
      const header = document.createElement("div");
      header.className = "c20-compendium-menu";
      header.appendChild(await createCompendiumSelect());

      if (connector.firstChild) {
        connector.firstChild.before(header);
      } else {
        connector.appendChild(header);
      }
    }

    if (!document.getElementById("c20-compendium")) {
      connector.appendChild(createCompendiumContainer());
    }

    await updateCompendiumSelect();
    await updateCompendium();
    createDragAndDrop();
  }

  // Menu Elements Builder
  async function createCompendiumSelect() {
    const container = document.createElement("div");
    container.className = "c20-compendium-dropdown";

    const select = document.createElement("select");
    select.id = "c20-compendium-select";
    select.name = "c20-compendium-select";

    select.addEventListener("change", async function (event) {
      settings.game = event.target.value;
      await updateCompendium();
    });

    container.appendChild(select);
    return container;
  }

  async function updateCompendiumSelect() {
    const select = document.querySelector("#c20-compendium-select");
    if (!select) return;

    const games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    if (settings.origin && !games.includes(settings.origin)) {
      games.push(settings.origin);
    }

    games.sort((a, b) => a.localeCompare(b));
    select.replaceChildren("");

    if (!games.includes(settings.game)) {
      settings.game = settings.origin || games[0] || "";
      await updateCompendium();
    }

    games.forEach((o) => {
      const option = document.createElement("option");
      option.value = o;
      option.textContent = o;
      if (o === settings.game) option.selected = true;
      select.appendChild(option);
    });
  }

  async function updateCompendium() {
    if (!window.campaign_id) return;

    // FIXED: Enforce a sequential write await to guarantee database stability before mapping layouts
    await StorageHelper.addOrUpdateItem(
      StorageHelper.dbNames.campaigns,
      window.campaign_id,
      settings.game,
      "compendium",
    );

    // FIXED: Abandoned fragile index array lookups. Target containers explicitly by descriptive states
    const nativeCompendiumPanel = document.querySelector("#vm_compendium_panel .compendium:not(#c20-compendium)");
    const customCompendiumPanel = document.getElementById("c20-compendium");
    const nativeTitleText = document.querySelector(".compendium-title");

    const isDefaultLibrary =
      settings.game === settings.origin ||
      !(await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, settings.game));

    if (isDefaultLibrary) {
      customCompendiumPanel?.classList.add("hidden");
      nativeCompendiumPanel?.classList.remove("hidden");

      if (nativeTitleText && nativeTitleText.textContent === "") {
        nativeTitleText.textContent = "Roll20";
      }
    } else {
      await createCompendium();
      nativeCompendiumPanel?.classList.add("hidden");
      customCompendiumPanel?.classList.remove("hidden");
    }
  }

  function createCompendiumContainer() {
    const div = document.createElement("div");
    div.className = "compendium hidden";
    div.id = "c20-compendium";
    div.setAttribute("data-v-f0ba7f9a", "");
    return div;
  }

  // Compendium View Initialization
  async function createCompendium() {
    const compendiumContainer = document.querySelector("#c20-compendium");
    if (!compendiumContainer) return;

    compendiumContainer.replaceChildren(createCompendiumEdit());
    compendiumContainer.appendChild(createCompendiumTitle());
    compendiumContainer.appendChild(createCompendiumSearch());
    compendiumContainer.appendChild(await createCompendiumCategories());
  }

  function createCompendiumEdit() {
    const editorBtn = document.createElement("button");
    editorBtn.textContent = "p";
    editorBtn.style.cssText = "font-family: Pictos; position: absolute; right: 30px;";
    editorBtn.addEventListener("click", CompendiumEditor.show);
    return editorBtn;
  }

  function createCompendiumTitle() {
    const title = document.createElement("div");
    title.className = "compendium-title";
    title.textContent = settings.game;
    title.setAttribute("data-v-7d9e6752", "");

    const breadCrumb = document.createElement("div");
    breadCrumb.className = "compendium-breadcrumb";
    breadCrumb.setAttribute("data-v-7d9e6752", "");
    breadCrumb.appendChild(title);
    breadCrumb.appendChild(createCompendiumTitleCrumb());

    const breadCrumbs = document.createElement("div");
    breadCrumbs.className = "compendium-breadcrumbs";
    breadCrumbs.setAttribute("data-v-a7a1a11c", "");
    breadCrumbs.appendChild(breadCrumb);

    const bigCrumb = document.createElement("div");
    bigCrumb.className = "compendium__breadcrumbs";
    bigCrumb.setAttribute("data-v-a7a1a11c", "");
    bigCrumb.appendChild(breadCrumbs);

    return bigCrumb;
  }

  function createCompendiumTitleCrumb() {
    const title = document.createElement("div");
    title.className = "compendium-title";
    title.setAttribute("data-v-7d9e6752", "");
    title.textContent = settings.game;

    const chevron = document.createElement("span");
    chevron.className = "grimoire__roll20-icon compendium-breadcrumb__chevron";
    chevron.textContent = "chevronLeft";
    chevron.setAttribute("data-v-2f0bc668", "");
    chevron.setAttribute("data-v-7d9e6752", "");

    const wrapper = document.createElement("span");
    wrapper.appendChild(chevron);
    wrapper.appendChild(title);

    const button = document.createElement("button");
    button.className = "el-button is-link compendium-breadcrumb__back";

    // FIXED: Upgraded the click handler to bring back the main categories dashboard smoothly!
    button.addEventListener("click", function () {
      const pageWrapper = document.querySelector("#c20-compendium-pages");
      const categoryWrapper = document.querySelector("#c20-compendium-categories");
      const searchClearBtn = document.querySelector("#c20-compendium-search-clear");

      // 1. Wipe out any rendered item subpages cleanly
      if (pageWrapper) pageWrapper.replaceChildren();

      // 2. Clear out any active search bar input filters
      if (searchClearBtn) searchClearBtn.click();

      // 3. SUCCESS: Force the hidden category selection menu back onto the user's screen!
      if (categoryWrapper) {
        categoryWrapper.style.display = ""; // Removes the 'none' restriction so it snaps back to visible
      }
    });

    button.appendChild(wrapper);
    button.setAttribute("data-v-7d9e6752", "");

    return button;
  }

  async function executeSearch(queryValue) {
    const pageWrapper = document.querySelector("#c20-compendium-pages");
    const clearBtn = document.querySelector("#c20-compendium-search-clear");
    if (!pageWrapper) return;

    if (queryValue === "") {
      pageWrapper.replaceChildren();
      clearBtn?.classList.add("hidden");
      return;
    }

    const results = await StorageHelper.searchIndexBySubstring(
      StorageHelper.dbNames.compendiums,
      settings.game,
      "names",
      queryValue,
    );

    if (!results || results.length === 0) {
      pageWrapper.replaceChildren(createNoSearchResults());
      clearBtn?.classList.remove("hidden");
      return;
    }

    pageWrapper.replaceChildren(getPageGroups(results));
    clearBtn?.classList.remove("hidden");
  }

  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  const debouncedSearch = debounce((val) => {
    executeSearch(val);
  }, 250);

  function createCompendiumSearch() {
    const wrapper = document.createElement("div");
    wrapper.className = "el-input__wrapper";
    wrapper.appendChild(createCompendiumSearchPrefix());

    const input = document.createElement("input");
    input.className = "el-input__inner";
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "Search Compendium";
    input.name = "compendium-search";

    input.addEventListener("input", (event) => {
      const query = event.target.value.trim();

      if (query === "") {
        document.querySelector("#c20-compendium-pages").replaceChildren();
        document.querySelector("#c20-compendium-search-clear")?.classList.add("hidden");
        return;
      }

      debouncedSearch(query);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(createCompendiumSearchSuffix());

    const searchBar = document.createElement("div");
    searchBar.className = "el-input el-input--prefix el-input--suffix compendium-searchbar";
    searchBar.appendChild(wrapper);

    const div = document.createElement("div");
    div.className = "compendium__search";
    div.setAttribute("data-v-f0ba7f9a", "");
    div.appendChild(searchBar);

    return div;
  }

  function createCompendiumSearchPrefix() {
    const icon = document.createElement("span");
    icon.className = "grimoire__roll20-icon";
    icon.textContent = "search";
    icon.setAttribute("data-v-2f0bc668", "");

    const innerPrefix = document.createElement("span");
    innerPrefix.className = "el-input__prefix-inner";
    innerPrefix.appendChild(icon);

    const prefix = document.createElement("span");
    prefix.className = "el-input__prefix";
    prefix.appendChild(innerPrefix);

    return prefix;
  }

  function createCompendiumSearchSuffix() {
    const icon = document.createElement("span");
    icon.textContent = "D";
    icon.style.fontFamily = "Pictos";
    icon.id = "c20-compendium-search-clear";
    icon.className = "el-icon el-input__icon el-input__clear hidden";

    icon.addEventListener("click", function () {
      const input = document.querySelector("input[name='compendium-search']");
      if (input) {
        input.value = "";
        input.dispatchEvent(new Event("input"));
      }
    });

    const innerSuffix = document.createElement("span");
    innerSuffix.className = "el-input__suffix-inner";
    innerSuffix.appendChild(icon);

    const suffix = document.createElement("span");
    suffix.className = "el-input__suffix";
    suffix.appendChild(innerSuffix);

    return suffix;
  }

  // Categories Dashboard Panel
  async function createCompendiumCategories() {
    const categoriesHeader = document.createElement("h3");
    categoriesHeader.className = "compendium-categories__header";
    categoriesHeader.textContent = "Categories";
    categoriesHeader.setAttribute("data-v-716a4aae", "");

    const container = document.createElement("div");
    container.className = "compendium-categories__container";
    container.style.textTransform = "capitalize";
    container.appendChild(categoriesHeader);
    container.setAttribute("data-v-716a4aae", "");

    // FIXED: Optimize initialization loops by iterating our static pluralName mapping table dictionary directly
    const possibleCategories = Object.keys(pluralName);

    // Concurrently process checking loops to populate valid dashboard items rapidly in parallel
    await Promise.all(
      possibleCategories.map(async (catKey) => {
        const categoryHasItems = await StorageHelper.listItemsByType(
          StorageHelper.dbNames.compendiums,
          settings.game,
          catKey,
        );
        if (categoryHasItems && categoryHasItems.length > 0) {
          container.appendChild(createCategory(catKey));
        }
      }),
    );

    const categoryWrapper = document.createElement("div");
    categoryWrapper.id = "c20-compendium-categories";
    categoryWrapper.appendChild(container);
    categoryWrapper.setAttribute("data-v-716a4aae", "");

    const pageWrapper = document.createElement("div");
    pageWrapper.id = "c20-compendium-pages";
    pageWrapper.setAttribute("data-v-716a4aae", "");

    const scroller = document.createElement("div");
    scroller.className = "scrollable";
    scroller.setAttribute("data-v-f0ba7f9a", "");
    scroller.appendChild(categoryWrapper);
    scroller.appendChild(pageWrapper);

    const pane = document.createElement("div");
    pane.className = "compendium__pane";
    pane.appendChild(scroller);
    pane.setAttribute("data-v-f0ba7f9a", "");

    return pane;
  }

  function createCategory(category) {
    const span = document.createElement("span");
    span.className = "compendium-category__name";
    span.textContent = pluralName[category] || category;
    span.setAttribute("data-v-cc29675b", "");

    const flourish = document.createElement("div");
    flourish.className = "compendium-category__flourish";
    flourish.setAttribute("data-v-cc29675b", "");

    const anchor = document.createElement("a");
    anchor.className = "compendium-category";
    anchor.appendChild(flourish);
    anchor.appendChild(span);
    anchor.setAttribute("data-v-cc29675b", "");
    anchor.setAttribute("data-v-716a4aae", "");

    anchor.addEventListener("click", async function () {
      const items = await StorageHelper.listItemsByType(StorageHelper.dbNames.compendiums, settings.game, category);
      const categoryWrapper = document.querySelector("#c20-compendium-categories");
      const pageWrapper = document.querySelector("#c20-compendium-pages");

      // FIXED: Removed trailing semicolon punctuation from style token string property values mapping
      if (categoryWrapper) categoryWrapper.style.display = "none";
      if (pageWrapper) pageWrapper.replaceChildren(getPageGroups(items, category));
    });

    const wrapper = document.createElement("div");
    wrapper.appendChild(anchor);

    return wrapper;
  }

  function getPageGroups(items, category = null) {
    const safeItems = Array.isArray(items) ? items : [];

    // FIXED: Rebuilt layout sorter block with a cross-browser safe reduce implementation loop
    const categoriesMap = safeItems.reduce((acc, item) => {
      let key = item.type || "unknown";
      if (item.type === "class") {
        key = `Class - ${item.groupName || "General"}`;
      } else if (item.type === "subclass") {
        key = `Subclass - ${item.className || "General"} - ${item.subclassName || "General"}`;
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const categoryKeys = Object.keys(categoriesMap);

    if (categoryKeys.length > 1) {
      const container = document.createElement("div");
      container.id = "c20-compendium-searchContainer";

      categoryKeys.sort().forEach((catKey) => {
        if (typeof createCompendiumPages === "function") {
          container.appendChild(createCompendiumPages(catKey, categoriesMap[catKey]));
        }
      });

      return container;
    }

    const finalCategoryKey = categoryKeys[0] || category;
    if (typeof createCompendiumPages === "function") {
      return createCompendiumPages(finalCategoryKey, safeItems);
    }

    return document.createDocumentFragment();
  }

  // Category Pages Element Handlers
  function createCompendiumPages(category, items) {
    const header = document.createElement("h3");
    header.className = "compendium-pages__header";

    const isSpecialCategory = category.startsWith("Class") || category.startsWith("Subclass");
    header.textContent = isSpecialCategory ? category : pluralName[category] || category;
    header.setAttribute("data-v-44ba3207", "");

    const container = document.createElement("div");
    container.className = "compendium-pages__container";
    container.appendChild(header);
    container.setAttribute("data-v-44ba3207", "");

    const itemWrapper = document.createElement("div");
    itemWrapper.className = "compendium-pages__wrapper";
    itemWrapper.setAttribute("data-v-44ba3207", "");

    const safeItemsList = Array.isArray(items) ? items : [];

    const mappedItems = safeItemsList
      .map((x) => ({
        id: x.id,
        // FIXED: Enforce a structural dynamic fallback string lookup map to guarantee name safety handles
        name: typeof getDisplayName === "function" ? getDisplayName(x) : x.name || "Untitled",
        groupName: x.groupName || "", // FIXED: Preserved group name parameters across the array pipeline
        type: x.type,
        source: x.source || "Unknown Source",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    // De-duplicate matching names safely inside local collections
    const uniqueItemsMap = new Map(mappedItems.map((v) => [v.name, v]));
    const deduplicatedItems = Array.from(uniqueItemsMap.values());

    deduplicatedItems.forEach((x) => {
      itemWrapper.appendChild(createCompendiumPageItem(x));
    });

    container.appendChild(itemWrapper);
    return container;
  }

  function createNoSearchResults() {
    const title = document.createElement("div");
    title.className = "compendium-error__title";
    title.textContent = "No Matching Results";

    const warning = document.createElement("div");
    warning.className = "compendium-error compendium-error--warning";
    warning.appendChild(title);

    const results = document.createElement("div");
    results.className = "search-results";
    results.appendChild(warning);
    results.setAttribute("data-v-f81afdd9", "");
    results.setAttribute("data-v-f0ba7f9a", "");

    return results;
  }

  function createCompendiumPageItem(data) {
    if (!data) return document.createElement("div");

    const source = document.createElement("span");
    source.textContent = data.source;
    source.className = "compendium-page__source-name";
    source.setAttribute("data-v-c8e7178d", "");

    const name = document.createElement("div");
    name.textContent = data.groupName ? `${data.groupName} ${data.name}`.trim() : data.name;
    name.setAttribute("data-v-c8e7178d", "");

    const nameContainer = document.createElement("div");
    nameContainer.className = "compendium-page__name";
    nameContainer.setAttribute("data-v-c8e7178d", "");
    nameContainer.appendChild(name);
    nameContainer.appendChild(source);

    const itemUpper = document.createElement("div");
    itemUpper.className = "compendium-page__upper";
    itemUpper.setAttribute("data-v-c8e7178d", "");

    if (Array.isArray(dragList) && dragList.includes(data.type)) {
      itemUpper.classList.add("ui-draggable", "ui-draggable-handle");
      itemUpper.setAttribute("draggable", "true");
      itemUpper.setAttribute("data-c20-Id", data.id);
    }

    itemUpper.appendChild(nameContainer);

    itemUpper.addEventListener("click", async function () {
      if (data.id) await createDisplayModal(data.id);
    });

    const page = document.createElement("div");
    page.className = "compendium-page";
    page.setAttribute("data-v-c8e7178d", "");
    page.setAttribute("data-v-44ba3207", "");
    page.appendChild(itemUpper);

    const itemLower = document.createElement("div");
    itemLower.className = "compendium-page__lower compendium-page__lower--closed";
    itemLower.setAttribute("data-v-c8e7178d", "");
    page.appendChild(itemLower);

    return page;
  }

  async function createDisplayModal(id) {
    if (!id || typeof CardModal === "undefined") return;

    const data = await StorageHelper.getItem(StorageHelper.dbNames.compendiums, settings.game, id);
    if (!data) return;

    const modalTitle = data.groupName && data.type === "condition" ? data.groupName : data.name || "Compendium Item";

    if (data.type === "condition") {
      new CardModal(modalTitle, displayStandard(data));
    } else if (data.type === "item") {
      new CardModal(modalTitle, displayItem(data));
    } else if (data.type === "spell") {
      new CardModal(modalTitle, displaySpell(data));
    } else if (data.type === "class") {
      new CardModal(modalTitle, displayClass(data));
    } else {
      new CardModal(modalTitle, displayStandard(data));
    }
  }

  function displayClass(data) {
    const container = document.createElement("div");

    if (data.groupName && typeof createLabelDisplay === "function") {
      container.appendChild(createLabelDisplay("Class", data.groupName));
    }
    if (data.level && typeof createLabelDisplay === "function") {
      container.appendChild(createLabelDisplay("Level", data.level));
    }

    const description = document.createElement("div");
    description.style.marginTop = "10px";

    // FIXED: Ensured clear fallback string safety guards to prevent unhandled regex string matching errors
    const rawDesc = data.description || "";
    const cleanedDesc = rawDesc.replace(/```(?:\r?\n)?/g, "");

    if (typeof createMarkdownDisplay === "function") {
      description.appendChild(createMarkdownDisplay(cleanedDesc));
    } else {
      description.textContent = cleanedDesc;
    }

    container.appendChild(description);
    return container;
  }

  function displayItem(data) {
    const container = document.createElement("div");
    if (typeof createLabelDisplay !== "function") return container;

    if (data.prop_Item_Type) container.appendChild(createLabelDisplay("Item Type", data.prop_Item_Type));
    if (data.cost) container.appendChild(createLabelDisplay("Cost", data.cost));
    if (data.count && Number(data.count) > 1) container.appendChild(createLabelDisplay("Count", data.count));

    if (data.weight) {
      const weightNum = Number(data.weight);
      container.appendChild(createLabelDisplay("Weight", weightNum <= 1 ? `${weightNum} lb` : `${weightNum} lbs`));
    }

    if (data.propV_magical) container.appendChild(createLabelDisplay("Magical", data.propV_magical));
    if (data.mod_AC) container.appendChild(createLabelDisplay("AC", data.mod_AC));

    // FIXED: Formatted text tracking variable scope leaks explicitly with local declarations
    if (data.mod_Damage) {
      let text = data.mod_Damage_Type ? `${data.mod_Damage} ${data.mod_Damage_Type}` : data.mod_Damage;
      if (data.mod_Secondary_Damage) {
        text += ` / ${data.mod_Secondary_Damage} ${data.mod_Secondary_Damage_Type}`;
      }
      container.appendChild(createLabelDisplay("Damage", text));
    }

    if (data.mod_Alternate_Damage) {
      let text = data.mod_Alternate_Damage_Type
        ? `${data.mod_Alternate_Damage} ${data.mod_Alternate_Damage_Type}`
        : data.mod_Alternate_Damage;
      if (data.mod_Alternate_Secondary_Damage) {
        text += ` / ${data.mod_Alternate_Secondary_Damage} ${data.mod_Alternate_Secondary_Damage_Type}`;
      }
      container.appendChild(createLabelDisplay("Two-Handed Damage", text));
    }

    if (data.mod_Weapon_Attacks) container.appendChild(createLabelDisplay("Attack Bonus", data.mod_Weapon_Attacks));
    if (data.mod_Weapon_Damage) container.appendChild(createLabelDisplay("Damage Bonus", data.mod_Weapon_Damage));
    if (data.mod_Spell_Attack) container.appendChild(createLabelDisplay("Spell Attack Bonus", data.mod_Spell_Attack));
    if (data.mod_Spell_DC) container.appendChild(createLabelDisplay("Spell DC Bonus", data.mod_Spell_DC));
    if (data.mod_Range) container.appendChild(createLabelDisplay("Range", data.mod_Range));

    const props = [];
    if (data.mod_StealthDisadvantage) props.push("Stealth Disadvantage");
    if (data.propV_hands) props.push(data.propV_hands);
    if (data.propV_size) props.push(data.propV_size);
    if (data.prop_Finesse) props.push("Finesse");
    if (data.prop_Thrown) props.push("Thrown");
    if (data.prop_Ammunition) props.push("Ammunition");
    if (data.prop_Loading) props.push("Loading");
    if (data.prop_Silvered) props.push("Silvered");
    if (data.prop_Reach) props.push("Reach");
    if (data.prop_Special) props.push("Special");

    if (props.length > 0) {
      container.appendChild(createLabelDisplay("Properties", props.sort().join(", ")));
    }

    const description = document.createElement("div");
    description.style.marginTop = "10px";

    if (typeof createMarkdownDisplay === "function") {
      description.appendChild(createMarkdownDisplay(data.description || ""));
    } else {
      description.textContent = data.description || "";
    }

    container.appendChild(description);
    return container;
  }

  function displayStandard(data) {
    const container = document.createElement("div");
    const description = document.createElement("div");

    const rawDesc = data?.description || "";
    const cleanedDesc = rawDesc.replace(/```(?:\r?\n)?/g, "");

    if (typeof createMarkdownDisplay === "function") {
      description.appendChild(createMarkdownDisplay(cleanedDesc));
    } else {
      description.textContent = cleanedDesc;
    }

    container.appendChild(description);
    return container;
  }

  function displaySpell(data) {
    if (!data) return document.createElement("div");

    const container = document.createElement("div");
    container.className = "c20-spell-card";
    if (typeof createLabelDisplay !== "function") return container;

    const spellLevel = String(data.level || "").toLowerCase();
    const spellSchool = data.school || "";
    const schoolText = spellLevel === "cantrip" ? `${spellSchool} ${spellLevel}` : `Level ${data.level} ${spellSchool}`;

    const schoolEl = createLabelDisplay("School", schoolText);
    if (schoolEl) {
      schoolEl.style.textTransform = "capitalize";
      container.appendChild(schoolEl);
    }

    if (data.time) container.appendChild(createLabelDisplay("Casting Time", data.time));
    if (data.range) container.appendChild(createLabelDisplay("Range", data.range));

    const components = [];
    if (data.verbal) components.push("V");
    if (data.somatic) components.push("S");
    if (data.material) components.push(`M (${data.materials || "components"})`);

    if (components.length > 0) {
      container.appendChild(createLabelDisplay("Components", components.join(", ")));
    }

    if (data.duration) container.appendChild(createLabelDisplay("Duration", data.duration));
    if (data.savingThrow) container.appendChild(createLabelDisplay("Saving Throw", data.savingThrow));

    container.appendChild(createLabelDisplay("Concentration", data.concentration === true ? "Yes" : "No"));
    container.appendChild(createLabelDisplay("Ritual", data.ritual === true ? "Yes" : "No"));

    const description = document.createElement("div");
    description.style.marginTop = "10px";

    if (typeof createMarkdownDisplay === "function") {
      description.appendChild(createMarkdownDisplay(data.description || ""));
    } else {
      description.textContent = data.description || "";
    }
    container.appendChild(description);

    if (data.higherLevels) {
      const higherTitle = document.createElement("div");
      higherTitle.textContent = "Higher Levels";
      higherTitle.style.cssText = "margin: 10px 0; font-weight: 700;";
      container.appendChild(higherTitle);

      const higherDescription = document.createElement("div");
      higherDescription.style.cssText = "margin-block: 10px;";

      // FIXED: Routed the higher levels payload through the markdown engine to perfectly format tables and bold text text logs!
      if (typeof createMarkdownDisplay === "function") {
        higherDescription.appendChild(createMarkdownDisplay(data.higherLevels));
      } else {
        // Safe layout fallback if utility is un-instantiated on boot frame
        higherDescription.textContent = data.higherLevels;
        higherDescription.style.whiteSpace = "break-spaces";
      }
      container.appendChild(higherDescription);
    }
    return container;
  }

  function createLabelDisplay(labelText, dataText) {
    const group = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = `${labelText}:`;
    label.style.fontWeight = "700";

    const value = document.createElement("span");
    value.textContent = dataText ?? "";
    value.style.paddingLeft = "4px";

    group.appendChild(label);
    group.appendChild(value);
    return group;
  }

  function getDisplayName(item) {
    if (!item) return "Untitled Item";
    if (item.type === "condition" && item.groupName) return item.groupName;
    if (item.type === "class" || item.type === "subclass") {
      return `${item.level || 1} Level - ${item.name || "Class"}`;
    }
    return item.name || "Untitled Item";
  }

  // Character Sheet Integration
  async function createDragAndDrop() {
    const compendium = document.querySelector("#c20-compendium");
    if (!compendium) return;

    // FIXED: Only execute the update if the flag isn't explicitly configured to avoid startup thrashes
    const currentImportFlag = await StorageHelper.getItem(StorageHelper.dbNames.campaigns, "all", "compendiumImport");
    if (currentImportFlag !== false) {
      await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", false, "compendiumImport");
    }

    compendium.addEventListener("dragstart", async function (event) {
      if (!event.target || !event.dataTransfer) return;

      if (event.target.classList.contains("ui-draggable")) {
        const itemId = event.target.getAttribute("data-c20-Id");
        const dragData = {
          type: "c20-compendium-item",
          game: settings.game,
          id: itemId,
        };

        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        settings.isDragging = true;
        await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", true, "compendiumImport");
      }
    });

    // FIXED: Swapped out broken non-existent string event name dragstop for official native dragend hook
    compendium.addEventListener("dragend", async function () {
      if (settings.isDragging === true) {
        settings.isDragging = false;
        await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", false, "compendiumImport");
      }
    });
  }

  const Compendium = {
    init: async function init() {
      const nativeTitleText = document.querySelector(".compendium-title");
      const currentTitle = nativeTitleText?.textContent || "";

      if (currentTitle === "") {
        if (nativeTitleText) nativeTitleText.textContent = "Roll20";
        settings.origin = "Roll20";
      } else {
        settings.origin = currentTitle;
      }

      if (!window.campaign_id) return;

      const storedData = await StorageHelper.getItem(StorageHelper.dbNames.campaigns, window.campaign_id, "compendium");

      if (storedData && (await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, storedData))) {
        settings.game = storedData;
      } else {
        settings.game = settings.origin;
      }

      await createUi();
    },
    update: async function update() {
      await updateCompendiumSelect();
      await updateCompendium();
    },
  };

  return Compendium;
})();
