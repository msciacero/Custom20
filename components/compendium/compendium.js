var Compendium = (function () {
  var dragList = ["background", "class", "feat", "item", "spell", "subclass"];
  var settings = {
    origin: "",
    game: "",
    isDragging: false,
  };
  var pluralName = {
    background: "backgrounds",
    class: "classes",
    condition: "conditions",
    feat: "feats",
    item: "items",
    spell: "spells",
    subclass: "subclasses",
  };

  async function createUi() {
    var connector = document.querySelector("#vm_compendium_panel");
    connector.style.overflowY = "hidden";

    var header = document.createElement("div");
    header.className = "c20-compendium-menu";
    header.appendChild(await createCompendiumSelect());

    connector.firstChild.before(header);
    connector.appendChild(createCompendiumContainer());

    updateCompendiumSelect();
    updateCompendium();
    createDragAndDrop();
  }

  //Menu
  async function createCompendiumSelect() {
    //compendium-title
    var container = document.createElement("div");
    container.className = "c20-compendium-dropdown";

    var select = document.createElement("select");
    select.id = "c20-compendium-select";
    select.name = "c20-compendium-select";

    // change compendiums
    select.addEventListener("change", async function (event) {
      settings.game = event.target.value;
      await updateCompendium();
    });

    // update compendium list
    document.querySelector("#vm_compendiumtab").addEventListener("click", function () {
      updateCompendiumSelect();
      updateCompendium();
    });

    container.appendChild(select);
    return container;
  }

  async function updateCompendiumSelect() {
    var games = await StorageHelper.listObjectStores(StorageHelper.dbNames.compendiums);
    games.push(settings.origin);
    games.sort((a, b) => {
      return a.localeCompare(b);
    });

    var select = document.querySelector("#c20-compendium-select");
    select.replaceChildren("");

    if (!games.includes(settings.game)) {
      settings.game = settings.origin;
      await updateCompendium();
    }

    games.forEach((o) => {
      var option = document.createElement("option");
      option.value = o;
      option.textContent = o;
      if (o === settings.game) option.selected = "selected";
      select.appendChild(option);
    });
  }

  async function updateCompendium() {
    StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, window.campaign_id, settings.game, "compendium");
    var compendiums = Array.from(document.querySelectorAll(".compendium"));

    if (
      settings.game === settings.origin ||
      !(await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, settings.game))
    ) {
      compendiums[1].classList.add("hidden");
      compendiums[0].classList.remove("hidden");
      if (document.querySelector(".compendium-title").textContent === "")
        document.querySelector(".compendium-title").textContent = "Roll20";
    } else {
      await createCompendium();
      compendiums[0].classList.add("hidden");
      compendiums[1].classList.remove("hidden");
    }
  }

  function createCompendiumContainer() {
    var div = document.createElement("div");
    div.className = "compendium hidden";
    div.id = "c20-compendium";
    div.setAttribute("data-v-f0ba7f9a", "");
    return div;
  }

  //Compendium
  async function createCompendium() {
    var compendiumContainer = document.querySelector("#c20-compendium");
    compendiumContainer.replaceChildren(createCompendiumEdit());
    compendiumContainer.appendChild(createCompendiumTitle());
    compendiumContainer.appendChild(createCompendiumSearch());
    compendiumContainer.appendChild(await createCompendiumCategories());
  }

  function createCompendiumEdit() {
    // compendium editor
    var editorBtn = document.createElement("button");
    editorBtn.textContent = "p";
    editorBtn.style.fontFamily = "Pictos";
    editorBtn.style.position = "absolute";
    editorBtn.style.right = "30px";
    editorBtn.addEventListener("click", CompendiumEditor.show);

    return editorBtn;
  }

  function createCompendiumTitle() {
    var title = document.createElement("div");
    title.className = "compendium-title";
    title.textContent = settings.game;
    title.setAttribute("data-v-7d9e6752", "");

    var breadCrumb = document.createElement("div");
    breadCrumb.className = "compendium-breadcrumb";
    breadCrumb.setAttribute("data-v-7d9e6752", "");
    title.setAttribute("data-v-7d9e6752", "");
    breadCrumb.appendChild(title);
    breadCrumb.appendChild(createCompendiumTitleCrumb());

    var breadCrumbs = document.createElement("div");
    breadCrumbs.className = "compendium-breadcrumbs";
    breadCrumbs.setAttribute("data-v-a7a1a11c", "");
    breadCrumbs.appendChild(breadCrumb);

    var bigCrumb = document.createElement("div");
    bigCrumb.className = "compendium__breadcrumbs";
    bigCrumb.setAttribute("data-v-a7a1a11c", "");
    bigCrumb.appendChild(breadCrumbs);

    return bigCrumb;
  }

  function createCompendiumTitleCrumb() {
    var title = document.createElement("div");
    title.className = "compendium-title";
    title.setAttribute("data-v-7d9e6752", "");
    title.textContent = settings.game;

    var chevron = document.createElement("span");
    chevron.className = "grimoire__roll20-icon compendium-breadcrumb__chevron";
    chevron.textContent = "chevronLeft";
    chevron.setAttribute("data-v-2f0bc668", "");
    chevron.setAttribute("data-v-7d9e6752", "");

    var wrapper = document.createElement("span");
    wrapper.appendChild(chevron);
    wrapper.appendChild(title);

    var button = document.createElement("button");
    button.className = "el-button is-link compendium-breadcrumb__back";
    button.addEventListener("click", function () {
      document.querySelector("#c20-compendium-pages").replaceChildren();

      document.querySelector("#c20-compendium-search-clear").click();
    });
    button.appendChild(wrapper);
    button.setAttribute("data-v-7d9e6752", "");

    return button;
  }

  //Search
  async function executeSearch(queryValue) {
    const pageWrapper = document.querySelector("#c20-compendium-pages");
    const clearBtn = document.querySelector("#c20-compendium-search-clear");

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
    var wrapper = document.createElement("div");
    wrapper.className = "el-input__wrapper";
    wrapper.appendChild(createCompendiumSearchPrefix());

    var input = document.createElement("input");
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

    var searchBar = document.createElement("div");
    searchBar.className = "el-input el-input--prefix el-input--suffix compendium-searchbar";
    searchBar.appendChild(wrapper);

    var div = document.createElement("div");
    div.className = "compendium__search";
    div.setAttribute("data-v-f0ba7f9a", "");
    div.appendChild(searchBar);

    return div;
  }

  function createCompendiumSearchPrefix() {
    var icon = document.createElement("span");
    icon.className = "grimoire__roll20-icon";
    icon.textContent = "search";
    icon.setAttribute("data-v-2f0bc668", "");

    var innerPrefix = document.createElement("span");
    innerPrefix.className = "el-input__prefix-inner";
    innerPrefix.appendChild(icon);

    var prefix = document.createElement("span");
    prefix.className = "el-input__prefix";
    prefix.appendChild(innerPrefix);

    return prefix;
  }

  function createCompendiumSearchSuffix() {
    var icon = document.createElement("span");
    icon.textContent = "D";
    icon.style.fontFamily = "Pictos";
    icon.id = "c20-compendium-search-clear";
    icon.className = "el-icon el-input__icon el-input__clear hidden";

    icon.addEventListener("click", function () {
      var input = document.querySelector("input[name='compendium-search']");
      input.value = "";
      input.dispatchEvent(new Event("input"));
    });

    var innerSuffix = document.createElement("span");
    innerSuffix.className = "el-input__suffix-inner";
    innerSuffix.appendChild(icon);

    var suffix = document.createElement("span");
    suffix.className = "el-input__suffix";
    suffix.appendChild(innerSuffix);

    return suffix;
  }

  //Categories
  async function createCompendiumCategories() {
    var categories = document.createElement("h3");
    categories.className = "compendium-categories__header";
    categories.textContent = "Categories";
    categories.setAttribute("data-v-716a4aae", "");

    var container = document.createElement("div");
    container.className = "compendium-categories__container";
    container.style.textTransform = "Capitalize";
    container.appendChild(categories);
    container.setAttribute("data-v-716a4aae", "");

    var storedCategories = await StorageHelper.listIndexKeys(StorageHelper.dbNames.compendiums, settings.game, "type");
    Array.from(storedCategories).forEach((x) => {
      container.appendChild(createCategory(x));
    });

    var categoryWrapper = document.createElement("div");
    categoryWrapper.id = "c20-compendium-categories";
    categoryWrapper.appendChild(container);
    categoryWrapper.setAttribute("data-v-716a4aae", "");

    var pageWrapper = document.createElement("div");
    pageWrapper.id = "c20-compendium-pages";
    pageWrapper.setAttribute("data-v-716a4aae", "");

    var scroller = document.createElement("div");
    scroller.className = "scrollable";
    scroller.setAttribute("data-v-f0ba7f9a", "");
    scroller.appendChild(categoryWrapper);
    scroller.appendChild(pageWrapper);

    var pane = document.createElement("div");
    pane.className = "compendium__pane";
    pane.appendChild(scroller);
    pane.setAttribute("data-v-f0ba7f9a", "");

    return pane;
  }

  function createCategory(category) {
    var span = document.createElement("span");
    span.className = "compendium-category__name";
    span.textContent = pluralName[category];
    span.setAttribute("data-v-cc29675b", "");

    var flourish = document.createElement("div");
    flourish.className = "compendium-category__flourish";
    flourish.setAttribute("data-v-cc29675b", "");

    var anchor = document.createElement("a");
    anchor.className = "compendium-category";
    anchor.appendChild(flourish);
    anchor.appendChild(span);
    anchor.setAttribute("data-v-cc29675b", "");
    anchor.setAttribute("data-v-716a4aae", "");

    anchor.addEventListener("click", async function () {
      var items = await StorageHelper.listItemsByType(StorageHelper.dbNames.compendiums, settings.game, category);
      var categoryWrapper = document.querySelector("#c20-compendium-categories");
      var pageWrapper = document.querySelector("#c20-compendium-pages");

      categoryWrapper.style.display = "none;";
      pageWrapper.replaceChildren(getPageGroups(items, category));
    });

    var wrapper = document.createElement("div");
    wrapper.appendChild(anchor);

    return wrapper;
  }

  function getPageGroups(items, category = null) {
    var categories = Object.groupBy(items, (item) => {
      if (item.type === "class") return `Class - ${item.groupName}`;
      if (item.type === "subclass") return `Subclass - ${item.className} - ${item.subclassName}`;
      return item.type;
    });
    if (Object.keys(categories).length > 1) {
      var container = document.createElement("div");
      container.id = "c20-compendium-searchContainer";

      Object.keys(categories)
        .sort()
        .forEach((category) => {
          container.appendChild(createCompendiumPages(category, categories[category]));
        });

      return container;
    }

    if (Object.keys(categories)) category = Object.keys(categories)[0];
    return createCompendiumPages(category, items);
  }

  //Category Pages
  function createCompendiumPages(category, items) {
    var header = document.createElement("h3");
    header.className = "compendium-pages__header";
    header.textContent =
      category.startsWith("Class") || category.startsWith("Subclass") ? category : pluralName[category];
    header.setAttribute("data-v-44ba3207", "");

    var container = document.createElement("div");
    container.className = "compendium-pages__container";
    container.appendChild(header);
    container.setAttribute("data-v-44ba3207", "");

    var itemWrapper = document.createElement("div");
    itemWrapper.className = "compendium-pages__wrapper";
    itemWrapper.setAttribute("data-v-44ba3207", "");

    var items = items
      .map((x) => ({
        id: x.id,
        name: getDisplayName(x),
        type: x.type,
        source: x.source,
      }))
      .sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      });

    items = [...new Map(items.map((v) => [v.name, v])).values()];

    items.forEach((x) => {
      itemWrapper.appendChild(createCompendiumPageItem(x));
    });
    container.appendChild(itemWrapper);
    return container;
  }

  function createNoSearchResults() {
    var title = document.createElement("div");
    title.className = "compendium-error__title";
    title.textContent = "No Matching Results";

    var warning = document.createElement("div");
    warning.className = "compendium-error compendium-error--warning";
    warning.appendChild(title);

    var results = document.createElement("div");
    results.className = "search-results";
    results.appendChild(warning);
    results.setAttribute("data-v-f81afdd9", "");
    results.setAttribute("data-v-f0ba7f9a", "");

    return results;
  }

  function createCompendiumPageItem(data) {
    var source = document.createElement("span");
    source.textContent = data.source;
    source.className = "compendium-page__source-name";
    source.setAttribute("data-v-c8e7178d", "");

    var name = document.createElement("div");
    name.textContent = data.groupName ? `${data.groupName} ${data.name}`.trim() : data.name;
    name.setAttribute("data-v-c8e7178d", "");

    var nameContainer = document.createElement("div");
    nameContainer.className = "compendium-page__name";
    nameContainer.setAttribute("data-v-c8e7178d", "");
    nameContainer.appendChild(name);
    nameContainer.appendChild(source);

    var itemUpper = document.createElement("div");
    itemUpper.className = "compendium-page__upper  ";
    itemUpper.setAttribute("data-v-c8e7178d", "");
    if (dragList.includes(data.type)) {
      itemUpper.classList.add("ui-draggable");
      itemUpper.classList.add("ui-draggable-handle");
      itemUpper.setAttribute("draggable", "true");
      itemUpper.setAttribute("data-c20-Id", data.id);
    }
    itemUpper.appendChild(nameContainer);

    itemUpper.addEventListener("click", async function () {
      await createDisplayModal(data.id);
    });

    var page = document.createElement("div");
    page.className = "compendium-page";
    page.setAttribute("data-v-c8e7178d", "");
    page.setAttribute("data-v-44ba3207", "");
    page.appendChild(itemUpper);

    var itemLower = document.createElement("div");
    itemLower.className = "compendium-page__lower compendium-page__lower--closed";
    itemLower.setAttribute("data-v-c8e7178d", "");
    page.appendChild(itemLower);

    return page;
  }

  async function createDisplayModal(id) {
    var data = await StorageHelper.getItem(StorageHelper.dbNames.compendiums, settings.game, id);

    if (data.type === "condition") new CardModal(data.groupName ? data.groupName : data.name, displayStandard(data));
    else if (data.type === "item") new CardModal(data.name, displayItem(data));
    else if (data.type === "spell") new CardModal(data.name, displaySpell(data));
    else if (data.type === "class") new CardModal(data.name, displayClass(data));
    else new CardModal(data.name, displayStandard(data));
  }

  function displayClass(data) {
    var container = document.createElement("div");
    if (data.groupName) container.appendChild(createLabelDisplay("Class", data.groupName));
    if (data.level) container.appendChild(createLabelDisplay("Level", data.level));
    var description = document.createElement("div");
    description.style.marginTop = "10px";

    // don't display code blocks
    description.appendChild(createMarkdownDisplay(data.description.replace(/```(?:\r?\n)?/g, "")));
    container.appendChild(description);

    return container;
  }

  function displayItem(data) {
    var container = document.createElement("div");

    if (data.prop_Item_Type) container.appendChild(createLabelDisplay("Item Type", data.prop_Item_Type));
    if (data.cost) container.appendChild(createLabelDisplay("Cost", data.cost));
    if (data.count && data.count > 1) container.appendChild(createLabelDisplay("Count", data.count));
    if (data.weight)
      container.appendChild(
        createLabelDisplay("Weight", data.weight <= 1 ? `${data.weight} lb` : `${data.weight} lbs`),
      );
    if (data.propV_magical) container.appendChild(createLabelDisplay("Magical", data.propV_magical));
    if (data.mod_AC) container.appendChild(createLabelDisplay("AC", data.mod_AC));

    // primary damage
    if (data.mod_Damage) {
      var text = data.mod_Damage_Type ? `${data.mod_Damage} ${data.mod_Damage_Type}` : data.mod_Damage;
      if (data.mod_Secondary_Damage) text += ` / ${data.mod_Secondary_Damage} ${data.mod_Secondary_Damage_Type}`;
      container.appendChild(createLabelDisplay("Damage", text));
    }

    // alternate damage
    if (data.mod_Alternate_Damage) {
      var text = data.mod_Alternate_Damage_Type
        ? `${data.mod_Alternate_Damage} ${data.mod_Alternate_Damage_Type}`
        : data.mod_Alternate_Damage;
      if (data.mod_Alternate_Secondary_Damage)
        text += ` / ${data.mod_Alternate_Secondary_Damage} ${data.mod_Alternate_Secondary_Damage_Type}`;
      container.appendChild(createLabelDisplay("Two-Handed Damage", text));
    }

    if (data.mod_Weapon_Attacks) container.appendChild(createLabelDisplay("Attack Bonus", data.mod_Weapon_Attacks));
    if (data.mod_Weapon_Damage) container.appendChild(createLabelDisplay("Damage Bonus", data.mod_Weapon_Damage));
    if (data.mod_Spell_Attack) container.appendChild(createLabelDisplay("Spell Attack Bonus", data.mod_Spell_Attack));
    if (data.mod_Spell_DC) container.appendChild(createLabelDisplay("Spell DC Bonus", data.mod_Spell_DC));
    if (data.mod_Range) container.appendChild(createLabelDisplay("Range", data.mod_Range));

    var props = [];
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
    if (props.length > 0) container.appendChild(createLabelDisplay("Properties", props.sort().join(", ")));

    var description = document.createElement("div");
    description.style.marginTop = "10px";
    description.appendChild(createMarkdownDisplay(data.description));
    container.appendChild(description);

    return container;
  }

  function displayStandard(data) {
    var container = document.createElement("div");

    var description = document.createElement("div");

    // don't display code blocks
    description.appendChild(createMarkdownDisplay(data.description.replace(/```(?:\r?\n)?/g, "")));
    container.appendChild(description);

    return container;
  }

  function displaySpell(data) {
    var container = document.createElement("div");

    var school = data.level === "cantrip" ? `${data.school} ${data.level}` : `Level ${data.level} ${data.school}`;
    var schoolEl = createLabelDisplay("School", school);
    schoolEl.style.textTransform = "capitalize";
    container.appendChild(schoolEl);

    if (data.time) container.appendChild(createLabelDisplay("Casting Time", data.time));
    if (data.range) container.appendChild(createLabelDisplay("Range", data.range));

    var components = [];
    if (data.verbal) components.push("V");
    if (data.somatic) components.push("S");
    if (data.material) components.push(`M (${data.materials})`);

    if (components.length > 0) container.appendChild(createLabelDisplay("Components", components.join(", ")));

    if (data.duration) container.appendChild(createLabelDisplay("Duration", data.duration));
    if (data.savingThrow) container.appendChild(createLabelDisplay("Saving Throw", data.savingThrow));
    container.appendChild(createLabelDisplay("Concentration", data.concentration === true ? "Yes" : "No"));
    container.appendChild(createLabelDisplay("Ritual", data.ritual === true ? "Yes" : "No"));

    var description = document.createElement("div");
    description.style.marginTop = "10px";
    description.appendChild(createMarkdownDisplay(data.description));
    container.appendChild(description);

    if (data.higherLevels) {
      var higherTitle = document.createElement("div");
      higherTitle.textContent = "Higher Levels";
      higherTitle.style.margin = "10px 0";
      higherTitle.style.fontWeight = "700";
      container.appendChild(higherTitle);

      var higherDescription = document.createElement("div");
      higherDescription.textContent = data.higherLevels;
      higherDescription.style.marginBlock = "10px";
      higherDescription.style.whiteSpace = "break-spaces";
      container.appendChild(higherDescription);
    }
    return container;
  }

  function createLabelDisplay(labelText, dataText) {
    var group = document.createElement("div");

    var label = document.createElement("span");
    label.textContent = `${labelText}:`;
    label.style.fontWeight = "700";

    var value = document.createElement("span");
    value.textContent = dataText;
    value.style.paddingLeft = "4px";

    group.appendChild(label);
    group.appendChild(value);
    return group;
  }

  function getDisplayName(item) {
    if (item.type === "condition" && item.groupName) return item.groupName;
    if (item.type === "class" || item.type === "subclass") return `${item.level} Level - ${item.name}`;
    return item.name;
  }

  // Character Sheet Integration
  async function createDragAndDrop() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", false, "compendiumImport");
    var compendium = document.querySelector("#c20-compendium");
    compendium.addEventListener("dragstart", async function (event) {
      if (event.target.classList.contains("ui-draggable")) {
        var itemId = event.target.getAttribute("data-c20-Id");
        var dragData = {
          type: "c20-compendium-item",
          game: settings.game,
          id: itemId,
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        settings.isDragging = true;
        await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", true, "compendiumImport");
      }
    });

    compendium.addEventListener("dragstop", async function (event) {
      if (settings.isDragging === true) {
        settings.isDragging = false;
        await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", false, "compendiumImport");
      }
    });
  }

  var Compendium = {
    // initialization
    init: async function init() {
      if (document.querySelector(".compendium-title").textContent === "")
        document.querySelector(".compendium-title").textContent = "Roll20";
      settings.origin = document.querySelector(".compendium-title").textContent;

      var storedData = await StorageHelper.getItem(StorageHelper.dbNames.campaigns, window.campaign_id, "compendium");
      if (storedData && (await StorageHelper.objectStoreExists(StorageHelper.dbNames.compendiums, storedData)))
        settings.game = storedData;
      else settings.game = origin;
      await createUi();
    },
  };
  return Compendium;
})();
