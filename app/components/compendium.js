var Compendium = (function () {
  var dragList = ["spell"];
  var settings = {
    origin: "",
    game: "",
    isDragging: false,
  };

  async function createUi() {
    var connector = document.querySelector("#vm_compendium_panel");

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
    compendiumContainer.replaceChildren(createCompendiumTitle());
    compendiumContainer.appendChild(createCompendiumSearch());
    compendiumContainer.appendChild(await createCompendiumCategories());
  }

  function createCompendiumTitle() {
    var title = document.createElement("div");
    title.className = "compendium-title";
    title.textContent = settings.game;
    title.setAttribute("data-v-7d9e6752", "");

    var breadCrumb = document.createElement("div");
    breadCrumb.className = "compendium-breadcrumb";
    breadCrumb.setAttribute("data-v-7d9e6752", "");
    breadCrumb.appendChild(title);
    breadCrumb.appendChild(createCompendiumTitleCrumb());

    var breadCrumbs = document.createElement("div");
    breadCrumbs.className = "compendium-breadcrumbs";
    breadCrumbs.setAttribute("data-v-f0ba7f9a", "");
    breadCrumbs.appendChild(breadCrumb);

    var bigCrumb = document.createElement("div");
    bigCrumb.className = "compendium__breadcrumbs";
    bigCrumb.setAttribute("data-v-f0ba7f9a", "");
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
    });
    button.appendChild(wrapper);
    button.setAttribute("data-v-7d9e6752", "");

    return button;
  }

  //Search
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
    input.addEventListener("input", async function (event) {
      var pageWrapper = document.querySelector("#c20-compendium-pages");

      if (event.target.value.trim() === "") {
        pageWrapper.replaceChildren();
        document.querySelector("#c20-compendium-search-clear").classList.add("hidden");
        return;
      }

      var range = IDBKeyRange.bound(event.target.value.toLowerCase(), event.target.value.toLowerCase() + "\uffff");
      var results = await StorageHelper.searchObjectByIndex(
        StorageHelper.dbNames.compendiums,
        settings.game,
        "names",
        range
      );

      if (results.length === 0) {
        pageWrapper.replaceChildren(createNoSearchResults());
        return;
      }

      var container = document.createElement("div");
      var categories = Object.groupBy(results, ({ type }) => type);
      Object.keys(categories)
        .sort()
        .forEach((category) => {
          container.appendChild(createCompendiumPages(category, categories[category]));
        });

      pageWrapper.replaceChildren(container);
      document.querySelector("#c20-compendium-search-clear").classList.remove("hidden");
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
    span.textContent = pluralize.isPlural(category) ? category : pluralize.plural(category);
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
      pageWrapper.replaceChildren(createCompendiumPages(category, items));
    });

    var wrapper = document.createElement("div");
    wrapper.appendChild(anchor);

    return wrapper;
  }

  //Category Pages
  function createCompendiumPages(category, items) {
    var header = document.createElement("h3");
    header.className = "compendium-pages__header";
    header.textContent = pluralize.isPlural(category) ? category : pluralize.plural(category);
    header.setAttribute("data-v-44ba3207", "");

    var container = document.createElement("div");
    container.className = "compendium-pages__container";
    container.appendChild(header);
    container.setAttribute("data-v-44ba3207", "");

    var itemWrapper = document.createElement("div");
    itemWrapper.className = "compendium-pages__wrapper";
    itemWrapper.setAttribute("data-v-44ba3207", "");
    items
      .sort((a, b) => {
        var nameA = a.groupName ? `${a.groupName}-${a.name}` : a.name;
        var nameB = b.groupName ? `${b.groupName}-${b.name}` : b.name;
        return nameA.localeCompare(nameB);
      })
      .forEach((x) => {
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

    var title = document.createElement("span");
    title.textContent = `${data.groupName ?? ""} ${data.name}`.trim();
    title.className = "ui-dialog-title";

    if (data.type === "condition")
      new ModalHelper(`${data.groupName ?? ""} ${data.name}`.trim(), displayCondition(data), true);
    else if (data.type === "spell") new ModalHelper(data.name, displaySpell(data), true);
    else new ModalHelper(title, displayDefaultTable(data), false);
  }

  function displayCondition(data) {
    var container = document.createElement("div");
    container.style.padding = "10px 10px 10px 0 ";

    var ulContainer = document.createElement("ul");
    data.desc.forEach((x) => {
      var li = document.createElement("li");
      li.textContent = x;
      ulContainer.appendChild(li);
    });
    container.appendChild(ulContainer);

    return container;
  }

  function displaySpell(data) {
    var container = document.createElement("div");
    container.style.margin = "10px 20px 20px";
    container.style.fontSize = "16px";

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

  function displayDefaultTable(data) {
    var table = document.createElement("table");
    table.style.margin = "10px";
    var headerRow = document.createElement("tr");
    var headerKey = document.createElement("th");
    headerKey.textContent = "Key";
    headerKey.style.border = "1px solid black";
    headerKey.style.padding = "0px 5px";
    headerRow.appendChild(headerKey);

    var headerValue = document.createElement("th");
    headerValue.textContent = "Value";
    headerRow.appendChild(headerValue);
    headerRow.style.border = "1px solid black";
    headerRow.style.padding = "0px 5px";
    table.appendChild(headerRow);

    Object.keys(data)
      .sort()
      .forEach((key) => {
        if (key != "id" && key != "names" && data[key] !== "") {
          var row = document.createElement("tr");
          var item1 = document.createElement("td");
          item1.textContent = key;
          item1.style.border = "1px solid black";
          item1.style.padding = "0px 5px";
          row.appendChild(item1);

          var item2 = document.createElement("td");
          item2.style.whiteSpace = "break-spaces";
          item2.style.border = "1px solid black";
          item2.style.padding = "0px 5px";
          if (Array.isArray(data[key])) {
            var ul = document.createElement("ul");
            data[key].forEach((x) => {
              var li = document.createElement("li");
              li.textContent = x;
              ul.appendChild(li);
            });
            item2.appendChild(ul);
          } else item2.textContent = data[key];
          row.appendChild(item2);

          table.appendChild(row);
        }
      });

    return table;
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

  function createMarkdownDisplay(text) {
    // Convert a text string that may contain markdown tables into a DocumentFragment
    // without using innerHTML. Non-table text blocks are preserved as <div> with
    // pre-wrapped whitespace so line breaks are visible.
    function splitRow(line) {
      // remove leading/trailing pipe and split on |, trimming each cell
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) line = line.trim().slice(1, -1);
      return line.split("|").map((s) => s.trim());
    }

    function parseDivider(line) {
      // parse alignment from divider cells, e.g. ":---", "---:", ":---:"
      const cells = splitRow(line);
      return cells.map((c) => {
        const t = c.trim();
        if (t.startsWith(":") && t.endsWith(":")) return "center";
        if (t.endsWith(":")) return "right";
        if (t.startsWith(":")) return "left";
        return "left"; // default
      });
    }

    function createTable(headerLine, dividerLine, rowLines) {
      const headers = splitRow(headerLine);
      const aligns = parseDivider(dividerLine);
      const table = document.createElement("table");
      table.className = "c20-markdown-table";
      // simple styling — rely on CSS for better control
      table.style.borderCollapse = "collapse";
      table.style.margin = "8px 0";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      headers.forEach((h, idx) => {
        const th = document.createElement("th");
        th.textContent = h;
        th.style.textAlign = aligns[idx] || "left";
        th.style.border = "1px solid var(--border-color, #ddd)";
        th.style.padding = "4px 6px";
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      rowLines.forEach((r) => {
        const cols = splitRow(r);
        const tr = document.createElement("tr");
        headers.forEach((_, idx) => {
          const td = document.createElement("td");
          td.textContent = cols[idx] ?? "";
          td.style.border = "1px solid var(--border-color, #ddd)";
          td.style.padding = "4px 6px";
          td.style.textAlign = aligns[idx] || "left";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      return table;
    }

    function isDividerLine(line) {
      // divider line typically contains dashes and pipes, optionally colons for alignment
      const cleaned = line.trim();
      if (!cleaned) return false;
      // must contain '-' and '|' or at least '-' and ':' in reasonable quantity
      return /-/.test(cleaned) && (cleaned.includes("|") || cleaned.includes(":"));
    }

    const frag = document.createDocumentFragment();
    const lines = text.split(/\r?\n/);
    let i = 0;
    let buffer = [];

    function flushBuffer() {
      if (buffer.length === 0) return;
      const div = document.createElement("div");
      div.style.whiteSpace = "pre-wrap"; // preserve line breaks
      div.textContent = buffer.join("\n");
      frag.appendChild(div);
      buffer = [];
    }

    while (i < lines.length) {
      const line = lines[i];
      // detect potential table header (contains |) and next line is divider
      if (line.includes("|") && i + 1 < lines.length && isDividerLine(lines[i + 1])) {
        // collect table lines until a blank line or a line without |
        const headerLine = line;
        const dividerLine = lines[i + 1];
        const rowLines = [];
        let j = i + 2;
        while (j < lines.length && lines[j].includes("|")) {
          rowLines.push(lines[j]);
          j++;
        }
        // flush any pending text before appending table
        flushBuffer();
        const table = createTable(headerLine, dividerLine, rowLines);
        frag.appendChild(table);
        i = j;
      } else {
        buffer.push(line);
        i++;
      }
    }

    flushBuffer();
    return frag;
  }

  // Character Sheet Integration
  function createDragAndDrop() {
    chrome.storage.local.set({ compendiumImport: false });
    var compendium = document.querySelector("#c20-compendium");
    compendium.addEventListener("dragstart", function (event) {
      if (event.target.classList.contains("ui-draggable")) {
        var itemId = event.target.getAttribute("data-c20-Id");
        var dragData = {
          type: "c20-compendium-item",
          game: settings.game,
          id: itemId,
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        settings.isDragging = true;
        chrome.storage.local.set({ compendiumImport: true });
      }
    });

    compendium.addEventListener("dragstop", async function (event) {
      if (settings.isDragging === true) {
        settings.isDragging = false;
        await chrome.storage.local.set({ compendiumImport: false });
      }
    });
  }

  var Compendium = {
    // initialization
    init: async function init() {
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

if (typeof define === "function" && define.amd) {
  define(function () {
    return Compendium;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Compendium;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Compendium", []).factory("Compendium", function () {
    return Compendium;
  });
}
