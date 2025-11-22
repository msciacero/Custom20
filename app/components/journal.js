//--Adds additional functionality to Roll20 Journal UI--
//create, rename, and delete folders
//reorganize items and folders
//hide/show folders and items
//search for an item with the option to include hidden items in the search
//loads/saves state

var Journal = (function () {
  var settings = {
    searchHidden: false,
    isLocked: true,
    storageKey: "",
  };

  var context = {
    folderMenu: null,
    itemMenu: null,
    curEl: null,
  };

  var controller = {
    searchFilter: "",
    tempExpand: [],
  };

  var nodes = {
    observer: null,
    lockControlIcon: null,
    journalSorts: [],
    itemCount: 0,
    folderCount: 0,
  };

  // controls
  function createLockControl() {
    // Add lock control
    var lockControl = document.createElement("button");
    lockControl.title = "Unlock to enable drag-and-drop sorting";
    lockControl.className = "btn c20-lock-control";

    nodes.lockControlIcon = document.createElement("span");
    nodes.lockControlIcon.className = "pictos";
    nodes.lockControlIcon.textContent = "(";
    lockControl.appendChild(nodes.lockControlIcon);

    var header = document.querySelector("#c20-journalfolderroot").parentElement;
    if (header) {
      header.prepend(lockControl);
    }

    document.querySelector("#c20-journalfolderroot").classList.add("c20-locked");

    return lockControl;
  }

  function createSearchControl() {
    let wrapper = document.createElement("div");
    wrapper.className = "content searchbox";

    let searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "Search by name...";
    searchBar.className = "ui-autocomplete-input";
    searchBar.autocomplete = "off";

    let hiddenToggle = document.createElement("a");
    hiddenToggle.className = "btn pictos c20-hiddenToggle";
    hiddenToggle.href = "#hiddenSearch";
    hiddenToggle.style.opacity = settings.searchHidden ? "1.0" : "0.4";
    hiddenToggle.textContent = "E";
    hiddenToggle.title = "Search hidden items";

    wrapper.appendChild(hiddenToggle);
    wrapper.appendChild(searchBar);
    document.querySelector("#journal").prepend(wrapper);

    hiddenToggle.addEventListener("click", function () {
      settings.searchHidden = !settings.searchHidden;
      hiddenToggle.style.opacity = settings.searchHidden ? "1.0" : "0.4";
      filterSearch();
    });

    searchBar.addEventListener("input", function () {
      controller.searchFilter = searchBar.value.toLowerCase();
      filterSearch();
    });
  }

  function filterSearch() {
    // find items to display
    let items = document.querySelectorAll("#c20-journalfolderroot .journalitem.dd-item");
    items.forEach((item) => {
      let name = item.querySelector(".namecontainer")?.textContent?.toLowerCase() || "";
      let tags = item.getAttribute("data-tags") || "";
      tags = tags.toLowerCase();
      let isHidden = item.className.includes("c20-hidden") || item.parentElement.closest(".c20-hidden");

      let matches = name.includes(controller.searchFilter) || tags.includes(controller.searchFilter);
      if (controller.searchFilter === "") {
        item.classList.remove("c20-search-hidden");
      } else if (matches && (settings.searchHidden || !isHidden)) {
        item.classList.remove("c20-search-hidden");
      } else {
        item.classList.add("c20-search-hidden");
      }
    });

    // hide folders that don't have any visible items, otherwise expand folder
    let folders = document.querySelectorAll("#c20-journalfolderroot .dd-folder");
    folders.forEach((folder) => {
      let hasVisible = folder.querySelectorAll(".dd-list .journalitem.dd-item:not(.c20-search-hidden)").length > 0;
      if (hasVisible) {
        folder.classList.remove("c20-search-hidden");

        var btn = Array.from(folder.childNodes).find((x) => x.tagName === "BUTTON" && x.style.display === "block");

        if (btn.getAttribute("data-action") === "expand") {
          if (!Object.keys(controller.tempExpand).includes(folder.getAttribute("data-globalfolderid"))) {
            controller.tempExpand[folder.getAttribute("data-globalfolderid")] = Array.from(folder.childNodes).find(
              (x) => x.tagName === "BUTTON" && x.style.display === "none"
            );
          }
          btn.click();
        }
      } else {
        folder.classList.add("c20-search-hidden");
      }
    });

    // reset folder if search is cleared
    if (controller.searchFilter === "") {
      Object.values(controller.tempExpand).forEach((btn) => btn.click());
      controller.tempExpand = [];
    }

    let root = document.querySelector("#c20-journalfolderroot");
    if (controller.searchFilter === "" || settings.searchHidden === false) {
      root.classList.remove("c20-search-all");
    } else {
      root.classList.add("c20-search-all");
    }
  }

  // context menus
  function createFolderContextMenu() {
    context.folderMenu = document.createElement("div");
    context.folderMenu.className = "d20contextmenu c20-contextmenu";
    context.folderMenu.style.display = "none";
    context.folderMenu.innerHTML = `<ul>
  <li data-action-type="add">Add Folder</li>
  <li data-action-type="rename">Rename Folder</li>
  <li data-action-type="remove" id="c20-jfc-del">Delete Folder</li>
  <li data-action-type="show" id="c20-jfc-show">Show Folder</li>
  <li data-action-type="hide" id="c20-jfc-hide">Hide Folder</li>
  <li data-action-type="toggle" id="c20-jfc-toggle">Toggle Hidden</li>
  </ul>`;

    document.body.appendChild(context.folderMenu);
    document.addEventListener("click", closeFolderContextmenu);
    document.addEventListener("contextmenu", ShowFolderContextMenu);

    context.folderMenu.addEventListener("click", function (e) {
      var actionType = e.target.getAttribute("data-action-type");
      if (actionType === "add") {
        var newFolder = createNewFolder({
          id: generateUUID(),
          pf: undefined,
          type: "folder",
          name: "New Folder",
          isCollapsed: false,
          isHidden: false,
        });
        context.curEl.closest("li").after(newFolder);
        saveState();
      } else if (actionType === "rename") {
        renameFolder();
      } else if (actionType === "remove") {
        nodes.folderCount = nodes.folderCount - 1;
        context.curEl.remove();
        saveState();
      } else if (actionType === "hide") {
        context.curEl.classList.add("c20-hidden");
        saveState();
      } else if (actionType === "show") {
        var hiddenParents = context.curEl.parentElement.closest(".c20-hidden");
        if (hiddenParents) {
          if (confirm("Item is inside a hidden folder. Showing this item will also unhide all parent folders.")) {
            while (hiddenParents) {
              hiddenParents.classList.remove("c20-hidden");
              hiddenParents = hiddenParents.closest(".c20-hidden");
            }
            context.curEl.classList.remove("c20-hidden");
            saveState();
          }
        } else {
          context.curEl.classList.remove("c20-hidden");
          saveState();
        }
      } else if (actionType === "toggle") {
        let root = document.querySelector("#c20-journalfolderroot");
        root.classList.toggle("c20-toggle");
      }
      context.folderMenu.style.display = "none";
    });
  }

  function displayFolderContextMenu(e) {
    context.curEl = e.target.closest(".dd-folder");
    context.folderMenu.style.top = e.pageY + "px";
    context.folderMenu.style.left = e.pageX + "px";

    if (context.curEl.querySelector(".dd-list").children.length === 0) {
      context.folderMenu.querySelector("#c20-jfc-del").style.display = "block";
    } else {
      context.folderMenu.querySelector("#c20-jfc-del").style.display = "none";
    }

    if (context.curEl.className.includes("c20-hidden") || context.curEl.closest(".c20-hidden")) {
      context.folderMenu.querySelector("#c20-jfc-show").style.display = "block";
      context.folderMenu.querySelector("#c20-jfc-hide").style.display = "none";
    } else {
      context.folderMenu.querySelector("#c20-jfc-show").style.display = "none";
      context.folderMenu.querySelector("#c20-jfc-hide").style.display = "block";
    }

    context.folderMenu.style.display = "block";
  }

  function closeFolderContextmenu() {
    context.folderMenu.style.display = "none";
  }

  function ShowFolderContextMenu(event) {
    if (!event.target.className.includes("dd-content") && !event.target.className.includes("folder-title")) {
      context.folderMenu.style.display = "none";
    } else {
      event.preventDefault();
      displayFolderContextMenu(event);
    }
  }

  function createItemContextMenu() {
    context.itemMenu = document.createElement("div");
    context.itemMenu.className = "d20contextmenu";
    context.itemMenu.style.display = "none";
    context.itemMenu.innerHTML = `<ul>
  <li data-action-type="add">Add Folder</li>
  <li data-action-type="show" id="c20-jic-show">Show</li>
  <li data-action-type="hide" id="c20-jic-hide">Hide</li>
  <li data-action-type="toggle" id="c20-jic-toggle">Toggle Hidden</li>
  </ul>`;

    document.body.appendChild(context.itemMenu);
    document.addEventListener("click", closeItemContextmenu);
    document.addEventListener("contextmenu", showItemContextMenu);

    context.itemMenu.addEventListener("click", function (e) {
      var actionType = e.target.getAttribute("data-action-type");
      if (actionType === "add") {
        var newFolder = createNewFolder({
          id: generateUUID(),
          pf: undefined,
          type: "folder",
          name: "New Folder",
          isCollapsed: false,
          isHidden: false,
        });
        context.curEl.after(newFolder);
        saveState();
      } else if (actionType === "notes") {
        // Future functionality??
      } else if (actionType === "hide") {
        context.curEl.classList.add("c20-hidden");
        saveState();
      } else if (actionType === "show") {
        var hiddenParents = context.curEl.parentElement.closest(".c20-hidden");
        if (hiddenParents) {
          if (confirm("Item is inside a hidden folder. Showing this item will also unhide all parent folders.")) {
            while (hiddenParents) {
              hiddenParents.classList.remove("c20-hidden");
              hiddenParents = hiddenParents.closest(".c20-hidden");
            }
            context.curEl.classList.remove("c20-hidden");
            saveState();
          }
        } else {
          context.curEl.classList.remove("c20-hidden");
          saveState();
        }
      } else if (actionType === "toggle") {
        let root = document.querySelector("#c20-journalfolderroot");
        root.classList.toggle("c20-toggle");
      }

      context.itemMenu.style.display = "none";
    });
  }

  function displayItemContextMenu(e, curEl) {
    context.curEl = curEl;
    context.itemMenu.style.top = e.pageY + "px";
    context.itemMenu.style.left = e.pageX + "px";

    if (context.curEl.className.includes("c20-hidden") || context.curEl.closest(".c20-hidden")) {
      context.itemMenu.querySelector("#c20-jic-show").style.display = "block";
      context.itemMenu.querySelector("#c20-jic-hide").style.display = "none";
    } else {
      context.itemMenu.querySelector("#c20-jic-show").style.display = "none";
      context.itemMenu.querySelector("#c20-jic-hide").style.display = "block";
    }

    context.itemMenu.style.display = "block";
    context.folderMenu.style.display = "none";
  }

  function closeItemContextmenu() {
    context.itemMenu.style.display = "none";
  }

  function showItemContextMenu(event) {
    //.journalitem.dd-item > .dd-content > .name > .namecontainer

    var curEl;
    if (event.target.className.includes("namecontainer")) {
      curEl = event.target.parentElement.parentElement.parentElement;
    } else if (event.target.className.includes("name")) {
      curEl = event.target.parentElement.parentElement;
    } else if (event.target.className.includes("dd-content")) {
      curEl = event.target.parentElement;
    } else {
      curEl = event.target;
    }

    if (!curEl.className.includes("dd-item") || curEl.className.includes("dd-folder")) {
      context.itemMenu.style.display = "none";
    } else {
      event.preventDefault();
      displayItemContextMenu(event, curEl);
    }
  }

  // folders
  function createNewFolder(data) {
    var expandControl = document.createElement("button");
    expandControl.type = "button";
    expandControl.className = "dd-sortablehandle";
    expandControl.style.display = data.isCollapsed ? "block" : "none";
    expandControl.setAttribute("data-action", "expand");
    expandControl.textContent = "Expand";

    var collapseControl = document.createElement("button");
    collapseControl.type = "button";
    collapseControl.className = "dd-unsortable";
    collapseControl.style.display = data.isCollapsed ? "none" : "block";
    collapseControl.setAttribute("data-action", "collapse");
    collapseControl.textContent = "Collapse";

    var sortHandle = document.createElement("div");
    sortHandle.className = "dd-handle dd-html5-sortablehandle html5-sortable";
    sortHandle.style.height = "30px";
    sortHandle.style.width = "20px";
    sortHandle.style.setProperty("display", "block", "important");
    sortHandle.style.opacity = "0";

    var content = document.createElement("div");
    content.className = "dd-content";

    var contentTitle = document.createElement("div");
    contentTitle.className = "folder-title";
    contentTitle.textContent = data.name;

    var newList = document.createElement("ol");
    newList.className = "dd-list";
    newList.style.display = data.isCollapsed ? "none" : "block";

    var newFolder = document.createElement("li");
    newFolder.className = "dd-item dd-folder";
    newFolder.setAttribute("data-globalfolderid", data.id);
    newFolder.setAttribute("draggable", true);
    if (data.isCollapsed) newFolder.classList.add("dd-collapsed");

    content.appendChild(contentTitle);
    newFolder.appendChild(collapseControl);
    newFolder.appendChild(expandControl);
    newFolder.appendChild(sortHandle);
    newFolder.appendChild(content);
    newFolder.appendChild(newList);

    // events
    expandControl.addEventListener("click", function () {
      expandControl.style.display = "none";
      collapseControl.style.display = "block";
      newList.style.display = "block";
      if (controller.searchFilter === "") saveState();
    });

    collapseControl.addEventListener("click", function () {
      collapseControl.style.display = "none";
      expandControl.style.display = "block";
      newList.style.display = "none";
      if (controller.searchFilter === "") saveState();
    });

    createFolderSort(newList);
    return newFolder;
  }

  function createFolderControls() {
    var root = document.querySelector("#c20-journalfolderroot");

    root.addEventListener("mousedown", function (event) {
      if (isFolder(event.target)) {
        var btn = Array.from(event.target.closest(".dd-folder").childNodes).find(
          (x) => x.tagName === "BUTTON" && x.style.display === "block"
        );
        btn.click();
      }
    });
  }

  function createFolderSort(list) {
    var s = Sortable.create(list, {
      group: "nested",
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      disabled: settings.isLocked,
      store: {
        set: function () {
          saveState();
        },
      },
    });

    nodes.journalSorts.push(s);
  }

  function isFolder(target) {
    if (target.classList.contains("folder-title")) return true;
    if (target.classList.contains("dd-content") && target.parentElement.classList.contains("dd-folder")) return true;
    if (target.classList.contains("dd-handle") && target.parentElement.classList.contains("dd-folder")) return true;
    if (target.classList.contains("dd-folder")) return true;
    return false;
  }

  function renameFolder() {
    const title = context.curEl.querySelector(".folder-title");
    if (!title) return;

    const oldText = title.childNodes.length ? title.childNodes[0].nodeValue || title.textContent : title.textContent;

    // create an input to replace the title text
    const input = document.createElement("input");
    input.type = "text";
    input.value = oldText.trim();
    input.style.minWidth = "120px";

    // remove existing text nodes and append input
    while (title.firstChild) title.removeChild(title.firstChild);
    title.appendChild(input);
    input.focus();

    function finish() {
      const val = input.value.trim() || "Untitled";
      // restore text
      while (title.firstChild) title.removeChild(title.firstChild);
      title.textContent = val;
      saveState();
    }

    input.addEventListener("blur", finish);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        input.blur();
      } else if (e.key === "Escape") {
        // cancel - restore previous
        while (title.firstChild) title.removeChild(title.firstChild);
        title.textContent = oldText;
      }
    });
  }

  function generateUUID() {
    var i = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    var e = new Array(36);
    var n = 0;
    var o;

    for (var l = 0; l < 36; l++)
      l == 8 || l == 13 || l == 18 || l == 23
        ? (e[l] = "-")
        : l == 14
        ? (e[l] = "4")
        : (n <= 2 && (n = (33554432 + Math.random() * 16777216) | 0),
          (o = n & 15),
          (n = n >> 4),
          (e[l] = i[l == 19 ? (o & 3) | 8 : o]));
    return e.join("");
  }

  // saving
  async function saveState() {
    var folders = Array.from(document.querySelectorAll("#c20-journalfolderroot"));
    folders = folders.concat(Array.from(document.querySelectorAll("#c20-journalfolderroot .dd-item.dd-folder")));

    //create directory structure with important data elements
    const saveData = Array.from(folders)?.map((folder) => {
      if (folder.children.length === 0) return;

      return {
        id: folder.getAttribute("data-globalfolderid"),
        name: folder.querySelector(".folder-title").textContent,
        pf: folder.parentElement.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid"),
        isCollapsed: folder.querySelector("ol").style.display === "none",
        items: Array.from(folder.querySelector("ol").children).map((item) => {
          if (item.classList.contains("dd-folder"))
            return {
              type: "folder",
              id: item.getAttribute("data-globalfolderid"),
              isHidden: item.classList.contains("c20-hidden"),
            };
          return {
            type: "item",
            id: item.getAttribute("data-itemid"),
            isHidden: item.classList.contains("c20-hidden"),
          };
        }),
      };
    });

    if (saveData[0] === undefined) await chrome.storage.local.remove([settings.storageKey]);
    else await chrome.storage.local.set({ [settings.storageKey]: JSON.stringify(saveData) });
  }

  // loading
  async function loadState() {
    var storedData = await chrome.storage.local.get([settings.storageKey]);
    var savedData = [{ id: null, isCollapsed: false, items: [], name: "root" }];
    if (storedData[settings.storageKey] !== undefined) savedData = JSON.parse(storedData[settings.storageKey]);
    // check for missing items
    var curItems = Array.from(document.querySelectorAll("#journalfolderroot .journalitem.dd-item")).map((x) =>
      x.getAttribute("data-itemid")
    );
    var savedItems = savedData.flatMap((x) => x.items.filter((y) => y.type == "item").map((y) => y.id));
    var newItems = curItems.filter((x) => !savedItems.includes(x));

    // check for deleted items
    var delItems = savedItems.filter((x) => !curItems.includes(x));
    for (var i = 0; i < savedData.length; i++) {
      savedData[i].items = savedData[i].items.filter((x) => !delItems.includes(x.id));
    }

    if (newItems) {
      // group new items by parent folder
      newItems = newItems.map((item) => {
        var elm = document.querySelector(`[data-itemid="${item}"]`).closest(".dd-item.dd-folder");
        return {
          id: item,
          pf: elm?.getAttribute("data-globalfolderid") ?? null,
          gf: elm?.parentElement?.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") ?? null,
        };
      });
      newItems = Object.groupBy(newItems, ({ pf }) => pf);

      Object.keys(newItems).forEach((folderId) => {
        //check if folder is saved
        var folderIndex = savedData.findIndex((x) => x.id === folderId || (x.id === null && folderId === "null"));
        if (folderIndex !== -1) {
          newItems[folderId].forEach((item) => {
            savedData[folderIndex].items.push({ type: "item", id: item.id, isHidden: false });
          });
        } else {
          // Build chain of folders from current to existing parent
          var folderChain = [];
          var currentFolderId = folderId;
          var currentGF = newItems[folderId][0].gf;
          var folderEl = document.querySelector(`#journalfolderroot [data-globalfolderid="${currentFolderId}"]`);

          while (currentFolderId !== null && !savedData.find((x) => x.id === currentFolderId)) {
            folderChain.unshift({
              id: currentFolderId,
              name: folderEl?.querySelector(".folder-title")?.textContent || "Untitled",
              pf: currentGF,
            });

            currentFolderId = currentGF;
            folderEl = document.querySelector(`#journalfolderroot [data-globalfolderid="${currentFolderId}"]`);
            currentGF =
              folderEl?.parentElement.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") ?? null;
          }

          // Find attachment point
          var attachIndex = savedData.findIndex((x) => x.id === currentFolderId);
          if (attachIndex === -1) attachIndex = 0;

          // Add folders to savedData and create items array for last folder
          folderChain.forEach((folder, idx) => {
            var parentFolder = idx === 0 ? savedData[attachIndex] : savedData[savedData.length - 1];
            parentFolder.items.push({ type: "folder", id: folder.id, isHidden: false });

            savedData.push({
              id: folder.id,
              name: folder.name,
              pf: folder.pf,
              isCollapsed: false,
              items:
                idx === folderChain.length - 1
                  ? newItems[folderId].map((item) => ({ type: "item", id: item.id, isHidden: false }))
                  : [],
            });
          });
        }
      });
    }

    var list = document.createElement("ol");
    list.classList.add("dd-list");
    createFolderSort(list);

    var root = document.createElement("div");
    root.appendChild(list);
    root.id = "c20-journalfolderroot";
    root.className = "dd folderroot";

    var folders = savedData.reduce((obj, x) => {
      if (x.id !== null) obj[x.id] = createNewFolder(x);
      return obj;
    }, {});

    for (var i = 0; i < savedData.length; i++) {
      const folderInfo = savedData[i];

      //folder
      var folder = folders[folderInfo.id];
      if (folderInfo.id === null) folder = root;
      if (folder === undefined || folder.querySelector("ol") === undefined) continue;

      //items in folder
      for (var j = 0; j < folderInfo.items.length; j++) {
        const itemInfo = folderInfo.items[j];

        var item;
        if (itemInfo.type === "item") {
          item = document.querySelector(`#journalfolderroot [data-itemid="${itemInfo.id}"]`);
          item.after(item.cloneNode(true));
        } else {
          item = folders[itemInfo.id];
        }

        if (item === null) continue;
        if (itemInfo.isHidden) item.classList.add("c20-hidden");

        folder.querySelector("ol").appendChild(item);
      }
    }

    var journalRoot = document.querySelector("#journalfolderroot");
    journalRoot.style.display = "none";
    journalRoot.before(root);

    nodes.folderCount = document.querySelectorAll("#journalfolderroot .dd-item.dd-folder").length;
    nodes.itemCount = document.querySelectorAll("#journalfolderroot .journalitem.dd-item").length;
  }

  // server side updates
  async function updateState() {
    var clientItems = Array.from(document.querySelectorAll("#c20-journalfolderroot .journalitem.dd-item")).map((x) =>
      x.getAttribute("data-itemid")
    );

    var serverItems = Array.from(document.querySelectorAll("#journalfolderroot .journalitem.dd-item")).map((x) =>
      x.getAttribute("data-itemid")
    );

    // deleted items (assume roll20 does full load)
    var delItems = clientItems.filter((x) => !serverItems.includes(x));
    delItems.forEach((item) => {
      document.querySelectorAll(`#c20-journalfolderroot [data-itemid="${item}"]`).forEach((i) => i.remove());
    });

    // new items
    var newItems = serverItems.filter((x) => !clientItems.includes(x));
    newItems.forEach((itemId) => {
      var item = document.querySelector(`[data-itemid="${itemId}"]`);
      item.after(item.cloneNode(true));
      var folderChain = [];
      var folder = item.closest(".dd-item.dd-folder");
      var existingFolder =
        folder !== null
          ? document.querySelector(
              `#c20-journalfolderroot [data-globalfolderid="${folder.getAttribute("data-globalfolderid")}"] > ol`
            )
          : document.querySelector("#c20-journalfolderroot > ol");

      while (existingFolder == null) {
        var newFolder = createNewFolder({
          isCollapsed: true,
          name: folder.querySelector(".folder-title")?.textContent,
          id: folder.getAttribute("data-globalfolderid"),
        });

        if (controller.searchFilter !== "") newFolder.classList.add("c20-search-hidden");
        folderChain.push(newFolder);

        folder = folder.parentElement.closest(".dd-item.dd-folder");
        existingFolder =
          folder !== null
            ? document.querySelector(
                `#c20-journalfolderroot [data-globalfolderid="${folder.getAttribute("data-globalfolderid")}"] > ol`
              )
            : document.querySelector("#c20-journalfolderroot > ol");
      }
      if (controller.searchFilter !== "") item.classList.add("c20-search-hidden");

      if (folderChain.length > 0) {
        folderChain.reverse().forEach((f, i) => {
          if (i == 0) existingFolder.appendChild(f);
          else folderChain[i - 1].querySelector("ol").appendChild(f);
        });

        folderChain[folderChain.length - 1].querySelector("ol").appendChild(item);
      } else {
        existingFolder.appendChild(item);
      }
    });

    saveState();
  }

  function serverChangeHandler() {
    observer = new MutationObserver(async (mutationsList, _) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.target.className !== "folder-title") {
          //Item or Folder added/remove
          var curFolders = document.querySelectorAll("#journalfolderroot .dd-item.dd-folder").length;
          var curItems = document.querySelectorAll("#journalfolderroot .journalitem.dd-item").length;

          if (curFolders != nodes.folderCount || curItems != nodes.itemCount) {
            await updateState();
            nodes.folderCount = curFolders;
            nodes.itemCount = curItems;
          }
        }
      }
    });

    const targetNode = document.querySelector("#journalfolderroot"); // Or any other DOM element
    const config = {
      childList: true, // Observe additions/removals of child nodes
      subtree: true, // Observe changes in descendants of the target node
    };

    observer.observe(targetNode, config);
  }

  var Journal = {
    // initialization
    init: async function init() {
      settings.storageKey = window.campaign_id + "-journal";
      if (nodes.journalSorts.length > 0) return; // already initialized
      if (document.querySelector("#journal > .content > .superadd.btn") !== null) return; // don't load if owner
      await loadState();

      // Add controls
      createSearchControl();
      createFolderControls();
      createFolderContextMenu();
      createItemContextMenu();
      serverChangeHandler();
      var lockControl = createLockControl();

      // lock/unlock event listener
      lockControl.addEventListener("click", function () {
        settings.isLocked = !settings.isLocked;
        nodes.journalSorts.forEach((s) => s.option("disabled", settings.isLocked));
        nodes.lockControlIcon.textContent = settings.isLocked ? "(" : ")";

        if (settings.isLocked)
          Array.from(document.querySelectorAll("#c20-journalfolderroot .dd-item.character")).forEach((el) =>
            el.setAttribute("draggable", true)
          );
      });
    },
    remove: async function remove() {
      observer.disconnect();
      nodes.journalSorts.forEach((s) => s.destroy());
      nodes.journalSorts = [];

      Array.from(document.querySelectorAll(`#c20-journalfolderroot .journalitem.dd-item`)).forEach((item) => {
        var placeHolder = document.querySelector(
          `#journalfolderroot [data-itemid="${item.getAttribute("data-itemid")}"]`
        );
        if (placeHolder) {
          if (item.classList.contains("character")) item.setAttribute("draggable", true);
          placeHolder.after(item);
          placeHolder.remove();
        }
      });

      document.querySelector("#c20-journalfolderroot").remove();
      document.querySelector(".c20-lock-control").remove();
      document.querySelector("#journal .content.searchbox").remove();
      document.querySelector("#journalfolderroot").style.display = "block";

      document.removeEventListener("contextmenu", closeFolderContextmenu);
      document.removeEventListener("contextmenu", ShowFolderContextMenu);
      context.folderMenu.remove();

      document.removeEventListener("contextmenu", closeItemContextmenu);
      document.removeEventListener("contextmenu", showItemContextMenu);
      context.itemMenu.remove();
    },
  };
  return Journal;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Journal;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Journal;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Journal", []).factory("Journal", function () {
    return Journal;
  });
}
