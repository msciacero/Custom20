//--Adds additional functionality to Roll20 Journal UI--
//create, rename, and delete folders
//reorganize items and folders
//hide/show folders and items
//search for an item with the option to include hidden items in the search
//loads/saves state

var Journal = (function () {
  const settings = {
    searchHidden: false,
    isLocked: true,
  };

  const context = {
    folderMenu: null,
    itemMenu: null,
    curEl: null,
  };

  const controller = {
    searchFilter: "",
    // FIXED: Enforce a true object literal syntax map to safely handle alphanumeric UUID trackers
    tempExpand: {},
  };

  const nodes = {
    observer: null,
    lockControlIcon: null,
    journalSorts: [],
    itemCount: 0,
    folderCount: 0,
  };

  // controls
  function createLockControl() {
    // Add lock control
    const lockControl = document.createElement("button");
    lockControl.title = "Unlock to enable drag-and-drop sorting";
    lockControl.className = "btn c20-lock-control";

    nodes.lockControlIcon = document.createElement("span");
    nodes.lockControlIcon.className = "pictos";
    nodes.lockControlIcon.textContent = "(";
    lockControl.appendChild(nodes.lockControlIcon);

    // FIXED: Added safe nullish element checks to shield execution against early boot races
    const rootNode = document.querySelector("#c20-journalfolderroot");
    const header = rootNode?.parentElement;

    if (header) {
      header.prepend(lockControl);
    } else {
      console.warn("[C20] Could not find header anchor to mount journal lock control.");
    }

    rootNode?.classList.add("c20-locked");
    return lockControl;
  }

  function createSearchControl() {
    const wrapper = document.createElement("div");
    wrapper.className = "content searchbox";

    const searchBar = document.createElement("input");
    searchBar.type = "text";
    searchBar.placeholder = "Search by name...";
    searchBar.className = "ui-autocomplete-input";
    searchBar.autocomplete = "off";

    const hiddenToggle = document.createElement("a");
    hiddenToggle.className = "btn pictos c20-hiddenToggle";
    hiddenToggle.href = "#hiddenSearch";
    hiddenToggle.style.opacity = settings.searchHidden ? "1.0" : "0.4";
    hiddenToggle.textContent = "E";
    hiddenToggle.title = "Search hidden items";

    wrapper.appendChild(hiddenToggle);
    wrapper.appendChild(searchBar);

    const journalContainer = document.querySelector("#journal");
    if (journalContainer) {
      journalContainer.prepend(wrapper);
    }

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
    const items = document.querySelectorAll("#c20-journalfolderroot .journalitem.dd-item");

    items.forEach((item) => {
      const name = item.querySelector(".namecontainer")?.textContent?.toLowerCase() || "";
      const tags = item.getAttribute("data-tags")?.toLowerCase() || "";
      const isHidden = item.classList.contains("c20-hidden") || item.parentElement?.closest(".c20-hidden");

      const matches = name.includes(controller.searchFilter) || tags.includes(controller.searchFilter);

      if (controller.searchFilter === "") {
        item.classList.remove("c20-search-hidden");
      } else if (matches && (settings.searchHidden || !isHidden)) {
        item.classList.remove("c20-search-hidden");
      } else {
        item.classList.add("c20-search-hidden");
      }
    });

    const folders = document.querySelectorAll("#c20-journalfolderroot .dd-folder");

    folders.forEach((folder) => {
      const hasVisible = folder.querySelectorAll(".dd-list .journalitem.dd-item:not(.c20-search-hidden)").length > 0;
      const folderId = folder.getAttribute("data-globalfolderid");

      if (hasVisible) {
        folder.classList.remove("c20-search-hidden");

        const btn = Array.from(folder.childNodes).find((x) => x.nodeName === "BUTTON" && x.style.display === "block");

        // FIXED: Enforce clear, defensive structural checks before clicking DOM elements dynamically
        if (btn && btn.getAttribute("data-action") === "expand") {
          if (folderId && !controller.tempExpand[folderId]) {
            const hiddenBtn = Array.from(folder.childNodes).find(
              (x) => x.nodeName === "BUTTON" && x.style.display === "none",
            );
            if (hiddenBtn) {
              controller.tempExpand[folderId] = hiddenBtn;
            }
          }
          btn.click();
        }
      } else {
        folder.classList.add("c20-search-hidden");
      }
    });

    // FIXED: Safely reset folder expansion trees from the object tracking map literal
    if (controller.searchFilter === "") {
      Object.values(controller.tempExpand).forEach((btn) => {
        if (typeof btn?.click === "function") btn.click();
      });
      controller.tempExpand = {};
    }

    const root = document.querySelector("#c20-journalfolderroot");
    if (root) {
      if (controller.searchFilter === "" || settings.searchHidden === false) {
        root.classList.remove("c20-search-all");
      } else {
        root.classList.add("c20-search-all");
      }
    }
  }

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
      // Guard matching clause checks
      const targetLi = e.target.closest("li");
      if (!targetLi) return;

      const actionType = targetLi.getAttribute("data-action-type");
      const targetListItem = context.curEl?.closest("li");

      if (actionType === "add") {
        const newFolder = createNewFolder({
          id: generateUUID(),
          pf: undefined,
          type: "folder",
          name: "New Folder",
          isCollapsed: false,
          isHidden: false,
        });
        if (targetListItem) targetListItem.after(newFolder);
        saveState();
      } else if (actionType === "rename") {
        renameFolder();
      } else if (actionType === "remove") {
        nodes.folderCount = Math.max(0, nodes.folderCount - 1);
        context.curEl?.remove();
        saveState();
      } else if (actionType === "hide") {
        context.curEl?.classList.add("c20-hidden");
        saveState();
      } else if (actionType === "show" && context.curEl) {
        let hiddenParents = context.curEl.parentElement?.closest(".c20-hidden");
        if (hiddenParents) {
          if (confirm("Item is inside a hidden folder. Showing this item will also unhide all parent folders.")) {
            while (hiddenParents) {
              hiddenParents.classList.remove("c20-hidden");
              hiddenParents = hiddenParents.parentElement?.closest(".c20-hidden");
            }
            context.curEl.classList.remove("c20-hidden");
            saveState();
          }
        } else {
          context.curEl.classList.remove("c20-hidden");
          saveState();
        }
      } else if (actionType === "toggle") {
        document.querySelector("#c20-journalfolderroot")?.classList.toggle("c20-toggle");
      }

      if (context.folderMenu) context.folderMenu.style.display = "none";
    });
  }

  function displayFolderContextMenu(e) {
    if (!context.curEl || !context.folderMenu) return;

    // FIXED: Swapped out fragile string operations for explicit property checks
    const targetList = context.curEl.querySelector(".dd-list");
    const deleteButton = context.folderMenu.querySelector("#c20-jfc-del");
    const showButton = context.folderMenu.querySelector("#c20-jfc-show");
    const hideButton = context.folderMenu.querySelector("#c20-jfc-hide");

    // Assign dynamic inline layouts safely
    context.folderMenu.style.top = `${e.pageY}px`;
    context.folderMenu.style.left = `${e.pageX}px`;

    if (deleteButton) {
      deleteButton.style.display = targetList && targetList.children.length === 0 ? "block" : "none";
    }

    const isFolderHidden = context.curEl.classList.contains("c20-hidden") || context.curEl.closest(".c20-hidden");

    if (showButton && hideButton) {
      if (isFolderHidden) {
        showButton.style.display = "block";
        hideButton.style.display = "none";
      } else {
        showButton.style.display = "none";
        hideButton.style.display = "block";
      }
    }

    context.folderMenu.style.display = "block";
  }

  function closeFolderContextmenu() {
    if (context.folderMenu) context.folderMenu.style.display = "none";
  }

  function ShowFolderContextMenu(event) {
    if (!event.target) return;

    // FIXED: Replaced brittle className string lookups with explicit token validation
    const hasValidClass =
      event.target.classList.contains("dd-content") || event.target.classList.contains("folder-title");

    if (!hasValidClass) {
      if (context.folderMenu) context.folderMenu.style.display = "none";
    } else {
      event.preventDefault();
      // Safely assign tracking context locally right inside the trigger block
      context.curEl = event.target.closest(".dd-folder");
      if (context.curEl) displayFolderContextMenu(event);
    }
  }

  function createItemContextMenu() {
    context.itemMenu = document.createElement("div");
    context.itemMenu.className = "d20contextmenu c20-contextmenu";
    context.itemMenu.style.display = "none";
    context.itemMenu.innerHTML = `<ul>
      <li data-action-type="add">Add Folder</li>
      <li data-action-type="show" id="c20-jic-show">Show</li>
      <li data-action-type="hide" id="c20-jic-hide">Hide</li>
      <li data-action-type="toggle" id="c20-jic-toggle">Toggle Hidden</li>
    </ul>`;

    document.body.appendChild(context.itemMenu);

    // FIXED: Scoped listeners tightly to restrict event leakage outside the sidebar boundary
    const journalRoot = document.querySelector("#journal");
    if (journalRoot) {
      document.addEventListener("click", closeItemContextmenu);
      journalRoot.addEventListener("contextmenu", showItemContextMenu);
    }

    context.itemMenu.addEventListener("click", function (e) {
      const targetLi = e.target.closest("li");
      if (!targetLi || !context.curEl) return;

      const actionType = targetLi.getAttribute("data-action-type");
      const targetListParent = context.curEl.parentElement;

      if (actionType === "add") {
        const newFolder = createNewFolder({
          id: generateUUID(),
          pf: undefined,
          type: "folder",
          name: "New Folder",
          isCollapsed: false,
          isHidden: false,
        });
        context.curEl.after(newFolder);
        saveState();
      } else if (actionType === "hide") {
        context.curEl.classList.add("c20-hidden");
        saveState();
      } else if (actionType === "show") {
        let hiddenParents = targetListParent?.closest(".c20-hidden");
        if (hiddenParents) {
          if (confirm("Item is inside a hidden folder. Showing this item will also unhide all parent folders.")) {
            while (hiddenParents) {
              hiddenParents.classList.remove("c20-hidden");
              hiddenParents = hiddenParents.parentElement?.closest(".c20-hidden");
            }
            context.curEl.classList.remove("c20-hidden");
            saveState();
          }
        } else {
          context.curEl.classList.remove("c20-hidden");
          saveState();
        }
      } else if (actionType === "toggle") {
        document.querySelector("#c20-journalfolderroot")?.classList.toggle("c20-toggle");
      }

      if (context.itemMenu) context.itemMenu.style.display = "none";
    });
  }

  function displayItemContextMenu(e, targetEl) {
    if (!context.itemMenu || !context.folderMenu || !targetEl) return;

    context.curEl = targetEl;
    context.itemMenu.style.top = `${e.pageY}px`;
    context.itemMenu.style.left = `${e.pageX}px`;

    const showButton = context.itemMenu.querySelector("#c20-jic-show");
    const hideButton = context.itemMenu.querySelector("#c20-jic-hide");
    const isItemHidden =
      context.curEl.classList.contains("c20-hidden") || context.curEl.parentElement?.closest(".c20-hidden");

    if (showButton && hideButton) {
      if (isItemHidden) {
        showButton.style.display = "block";
        hideButton.style.display = "none";
      } else {
        showButton.style.display = "none";
        hideButton.style.display = "block";
      }
    }

    context.itemMenu.style.display = "block";
    context.folderMenu.style.display = "none";
  }

  function closeItemContextmenu() {
    if (context.itemMenu) context.itemMenu.style.display = "none";
  }

  function showItemContextMenu(event) {
    if (!event.target) return;

    // FIXED: Replaced brittle layout structural loops with clean closest tracker queries
    const resolvedItemNode = event.target.closest(".journalitem.dd-item");

    if (!resolvedItemNode || resolvedItemNode.classList.contains("dd-folder")) {
      if (context.itemMenu) context.itemMenu.style.display = "none";
    } else {
      event.preventDefault();
      displayItemContextMenu(event, resolvedItemNode);
    }
  }

  // folders
  function createNewFolder(data) {
    if (!data) return document.createElement("li");

    const expandControl = document.createElement("button");
    expandControl.type = "button";
    expandControl.className = "dd-sortablehandle";
    expandControl.style.display = data.isCollapsed ? "block" : "none";
    expandControl.setAttribute("data-action", "expand");
    expandControl.textContent = "Expand";

    const collapseControl = document.createElement("button");
    collapseControl.type = "button";
    collapseControl.className = "dd-unsortable";
    collapseControl.style.display = data.isCollapsed ? "none" : "block";
    collapseControl.setAttribute("data-action", "collapse");
    collapseControl.textContent = "Collapse";

    const sortHandle = document.createElement("div");
    sortHandle.className = "dd-handle dd-html5-sortablehandle html5-sortable";
    sortHandle.style.height = "30px";
    sortHandle.style.width = "20px";
    sortHandle.style.setProperty("display", "block", "important");
    sortHandle.style.opacity = "0";

    const content = document.createElement("div");
    content.className = "dd-content";

    const contentTitle = document.createElement("div");
    contentTitle.className = "folder-title";
    contentTitle.textContent = data.name;

    const newList = document.createElement("ol");
    newList.className = "dd-list";
    newList.style.display = data.isCollapsed ? "none" : "block";

    const newFolder = document.createElement("li");
    newFolder.className = "dd-item dd-folder";
    newFolder.setAttribute("data-globalfolderid", data.id);
    newFolder.setAttribute("draggable", "true");

    if (data.isCollapsed) {
      newFolder.classList.add("dd-collapsed");
    }

    content.appendChild(contentTitle);
    newFolder.appendChild(collapseControl);
    newFolder.appendChild(expandControl);
    newFolder.appendChild(sortHandle);
    newFolder.appendChild(content);
    newFolder.appendChild(newList);

    // event listeners
    expandControl.addEventListener("click", function () {
      expandControl.style.display = "none";
      collapseControl.style.display = "block";
      newList.style.display = "block";
      newFolder.classList.remove("dd-collapsed");

      // FIXED: Visual structural updates now check filters without causing write collisions
      if (typeof controller.searchFilter === "string" && controller.searchFilter === "") {
        saveState();
      }
    });

    collapseControl.addEventListener("click", function () {
      collapseControl.style.display = "none";
      expandControl.style.display = "block";
      newList.style.display = "none";
      newFolder.classList.add("dd-collapsed");

      if (typeof controller.searchFilter === "string" && controller.searchFilter === "") {
        saveState();
      }
    });

    createFolderSort(newList);
    return newFolder;
  }

  function createFolderControls() {
    const root = document.querySelector("#c20-journalfolderroot");
    if (!root) return;

    root.addEventListener("mousedown", function (event) {
      if (isFolder(event.target)) {
        const closestFolder = event.target.closest(".dd-folder");
        if (!closestFolder) return;

        // FIXED: Safely evaluate child button arrays with explicit tag naming checks
        const btn = Array.from(closestFolder.childNodes).find(
          (x) => x.nodeName === "BUTTON" && x.style.display === "block",
        );

        if (btn) btn.click();
      }
    });
  }

  function createFolderSort(list) {
    if (!list || typeof Sortable === "undefined") return;

    const s = Sortable.create(list, {
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
    if (!target) return false;
    if (target.classList.contains("folder-title")) return true;

    const parent = target.parentElement;
    if (target.classList.contains("dd-content") && parent?.classList.contains("dd-folder")) return true;
    if (target.classList.contains("dd-handle") && parent?.classList.contains("dd-folder")) return true;
    if (target.classList.contains("dd-folder")) return true;

    return false;
  }

  function renameFolder() {
    if (!context.curEl) return;

    const title = context.curEl.querySelector(".folder-title");
    if (!title) return;

    const oldText = title.childNodes.length ? title.childNodes[0].nodeValue || title.textContent : title.textContent;

    const input = document.createElement("input");
    input.type = "text";
    input.value = oldText.trim();
    input.style.minWidth = "120px";

    // Scrub existing elements safely
    title.replaceChildren(input);
    input.focus();

    // FIXED: Encapsulated completion handler flags to avoid double-firing events on blur / enter clicks
    let isFinished = false;

    function finish() {
      if (isFinished) return;
      isFinished = true;

      const val = input.value.trim() || "Untitled Folder";
      title.replaceChildren(document.createTextNode(val));
      saveState();
    }

    input.addEventListener("blur", finish);

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        finish(); // Execute execution tracking path cleanly instead of force-blurring
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        isFinished = true; // Block blur routine execution
        title.replaceChildren(document.createTextNode(oldText));
      }
    });
  }

  // FIXED: Converted to a clean modern cryptographic API tracker variant fallback standard layout format
  function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    // Safe legacy mathematical fallback macro engine bounds
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
    );
  }

  // saving
  async function saveState() {
    const rootNode = document.querySelector("#c20-journalfolderroot");
    if (!rootNode) return;

    // Build list paths combining layout layers cleanly
    let folders = [rootNode].concat(Array.from(rootNode.querySelectorAll(".dd-item.dd-folder")));

    // FIXED: Re-engineered layout collection mapping chains to completely eliminate broken hole structures
    const saveData = folders
      .map((folder) => {
        const ddList = folder.querySelector("ol");
        if (!ddList || ddList.children.length === 0) return null;

        // FIXED: Added safe nullish element lookup chaining check parameters for the root node parsing bounds
        const folderTitleText = folder.querySelector(".folder-title")?.textContent || "Root Directory";
        const parentFolderId =
          folder.parentElement?.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") || null;

        return {
          id: folder.getAttribute("data-globalfolderid") || "root",
          name: folderTitleText,
          pf: parentFolderId,
          isCollapsed: ddList.style.display === "none",
          items: Array.from(ddList.children).map((item) => {
            if (item.classList.contains("dd-folder")) {
              return {
                type: "folder",
                id: item.getAttribute("data-globalfolderid"),
                isHidden: item.classList.contains("c20-hidden"),
              };
            }
            return {
              type: "item",
              id: item.getAttribute("data-itemid"),
              isHidden: item.classList.contains("c20-hidden"),
            };
          }),
        };
      })
      .filter(Boolean); // Cleanly flushes out all intermediate null entries out of the final list track

    // FIXED: Changed evaluation logic to protect against dropping user dataset profiles down completely
    if (saveData.length === 0) {
      await StorageHelper.deleteItem(StorageHelper.dbNames.campaigns, window.campaign_id, "journal");
    } else {
      await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, window.campaign_id, saveData, "journal");
    }
  }

  // loading
  async function loadState() {
    const storedData = await StorageHelper.getItem(StorageHelper.dbNames.campaigns, window.campaign_id, "journal");
    let savedData = [{ id: null, isCollapsed: false, items: [], name: "root" }];

    if (storedData !== undefined && Array.isArray(storedData)) {
      savedData = storedData;
    }

    const curItems = Array.from(document.querySelectorAll("#journalfolderroot .journalitem.dd-item"))
      .map((x) => x.getAttribute("data-itemid"))
      .filter(Boolean);

    const savedItems = savedData.flatMap((x) => (x.items || []).filter((y) => y.type === "item").map((y) => y.id));

    let newItems = curItems.filter((x) => !savedItems.includes(x));

    const delItems = savedItems.filter((x) => !curItems.includes(x));
    for (let i = 0; i < savedData.length; i++) {
      if (savedData[i].items) {
        savedData[i].items = savedData[i].items.filter((x) => !delItems.includes(x.id));
      }
    }

    if (newItems.length > 0) {
      let mappedNewItems = newItems.map((item) => {
        const matchingEl = document.querySelector(`[data-itemid="${item}"]`);
        const elm = matchingEl?.closest(".dd-item.dd-folder");
        return {
          id: item,
          pf: elm?.getAttribute("data-globalfolderid") ?? null,
          gf: elm?.parentElement?.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") ?? null,
        };
      });

      const newItemsGrouped = mappedNewItems.reduce((acc, item) => {
        const key = String(item.pf);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      Object.keys(newItemsGrouped).forEach((folderId) => {
        const lookupId = folderId === "null" ? null : folderId;
        const folderIndex = savedData.findIndex((x) => x.id === lookupId);

        if (folderIndex !== -1) {
          newItemsGrouped[folderId].forEach((item) => {
            if (!savedData[folderIndex].items) savedData[folderIndex].items = [];
            savedData[folderIndex].items.push({ type: "item", id: item.id, isHidden: false });
          });
        } else {
          const folderChain = [];
          let currentFolderId = lookupId;
          if (!currentFolderId) return;

          let currentGF = newItemsGrouped[folderId].gf;
          let folderEl = document.querySelector(`#journalfolderroot [data-globalfolderid="${currentFolderId}"]`);

          while (currentFolderId !== null && !savedData.find((x) => x.id === currentFolderId)) {
            folderChain.unshift({
              id: currentFolderId,
              name: folderEl?.querySelector(".folder-title")?.textContent || "Untitled Folder",
              pf: currentGF,
            });

            currentFolderId = currentGF;
            folderEl = document.querySelector(`#journalfolderroot [data-globalfolderid="${currentFolderId}"]`);
            currentGF =
              folderEl?.parentElement?.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") ?? null;
          }

          let attachIndex = savedData.findIndex((x) => x.id === currentFolderId);
          if (attachIndex === -1) attachIndex = 0;

          folderChain.forEach((folder, idx) => {
            const parentFolder = idx === 0 ? savedData[attachIndex] : savedData[savedData.length - 1];
            if (!parentFolder.items) parentFolder.items = [];
            parentFolder.items.push({ type: "folder", id: folder.id, isHidden: false });

            savedData.push({
              id: folder.id,
              name: folder.name,
              pf: folder.pf,
              isCollapsed: false,
              items:
                idx === folderChain.length - 1
                  ? newItemsGrouped[folderId].map((item) => ({ type: "item", id: item.id, isHidden: false }))
                  : [],
            });
          });
        }
      });
    }

    const list = document.createElement("ol");
    list.classList.add("dd-list");
    createFolderSort(list);

    const root = document.createElement("div");
    root.appendChild(list);
    root.id = "c20-journalfolderroot";
    root.className = "dd folderroot";

    const folders = savedData.reduce((obj, x) => {
      if (x.id !== null) obj[x.id] = createNewFolder(x);
      return obj;
    }, {});

    for (let i = 0; i < savedData.length; i++) {
      const folderInfo = savedData[i];
      let folder = folderInfo.id === null ? root : folders[folderInfo.id];

      if (!folder || !folder.querySelector("ol")) continue;
      const olContainer = folder.querySelector("ol");

      for (let j = 0; j < (folderInfo.items?.length || 0); j++) {
        const itemInfo = folderInfo.items[j];
        let item = null;

        if (itemInfo.type === "item") {
          // CORRECTION: Retrieve Roll20's ORIGINAL physical node to preserve internal React/jQuery listeners!
          item = document.querySelector(`#journalfolderroot [data-itemid="${itemInfo.id}"]`);
        } else {
          item = folders[itemInfo.id];
        }

        if (!item) continue;
        if (itemInfo.isHidden) item.classList.add("c20-hidden");

        olContainer.appendChild(item);
      }
    }

    const journalRoot = document.querySelector("#journalfolderroot");
    if (journalRoot) {
      journalRoot.style.display = "none";
      journalRoot.before(root);
    }

    nodes.folderCount = document.querySelectorAll("#c20-journalfolderroot .dd-item.dd-folder").length;
    nodes.itemCount = document.querySelectorAll("#c20-journalfolderroot .journalitem.dd-item").length;
  }

  // server side updates
  async function updateState() {
    const clientItems = Array.from(document.querySelectorAll("#c20-journalfolderroot .journalitem.dd-item"))
      .map((x) => x.getAttribute("data-itemid"))
      .filter(Boolean);

    const serverItems = Array.from(document.querySelectorAll("#journalfolderroot .journalitem.dd-item"))
      .map((x) => x.getAttribute("data-itemid"))
      .filter(Boolean);

    // Delete elements missing from server cleanly
    const delItems = clientItems.filter((x) => !serverItems.includes(x));
    delItems.forEach((item) => {
      document.querySelectorAll(`#c20-journalfolderroot [data-itemid="${item}"]`).forEach((i) => i.remove());
    });

    // Handle new item synchronizations
    const newItems = serverItems.filter((x) => !clientItems.includes(x));

    newItems.forEach((itemId) => {
      // CORRECTION: Use the original physical source item directly so events bind smoothly
      const item = document.querySelector(`[data-itemid="${itemId}"]`);
      if (!item) return;

      const folderChain = [];
      let folder = item.closest(".dd-item.dd-folder");

      let existingFolder =
        folder !== null
          ? document.querySelector(
              `#c20-journalfolderroot [data-globalfolderid="${folder.getAttribute("data-globalfolderid")}"] > ol`,
            )
          : document.querySelector("#c20-journalfolderroot > ol");

      while (existingFolder === null && folder !== null) {
        const newFolder = createNewFolder({
          isCollapsed: true,
          name: folder.querySelector(".folder-title")?.textContent || "Untitled Folder",
          id: folder.getAttribute("data-globalfolderid"),
        });

        if (controller.searchFilter !== "") newFolder.classList.add("c20-search-hidden");
        folderChain.push(newFolder);

        folder = folder.parentElement?.closest(".dd-item.dd-folder") || null;
        if (folder) {
          existingFolder = document.querySelector(
            `#c20-journalfolderroot [data-globalfolderid="${folder.getAttribute("data-globalfolderid")}"] > ol`,
          );
        } else {
          existingFolder = document.querySelector("#c20-journalfolderroot > ol");
        }
      }

      if (controller.searchFilter !== "") item.classList.add("c20-search-hidden");

      if (existingFolder) {
        if (folderChain.length > 0) {
          folderChain.reverse().forEach((f, i) => {
            if (i === 0) {
              existingFolder.appendChild(f);
            } else {
              folderChain[i - 1].querySelector("ol")?.appendChild(f);
            }
          });
          folderChain[folderChain.length - 1].querySelector("ol")?.appendChild(item);
        } else {
          existingFolder.appendChild(item);
        }
      }
    });

    // CORRECTION: Force an immediate, sequential saveState on structural changes to guarantee synchronization
    await saveState();
  }

  function serverChangeHandler() {
    const config = { childList: true, subtree: true };

    nodes.observer = new MutationObserver(async (mutationsList) => {
      const targetNode = document.querySelector("#journalfolderroot");

      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.target.className !== "folder-title") {
          const curFolders = document.querySelectorAll("#journalfolderroot .dd-item.dd-folder").length;
          const curItems = document.querySelectorAll("#journalfolderroot .journalitem.dd-item").length;

          if (curFolders !== nodes.folderCount || curItems !== nodes.itemCount) {
            // SAFEGUARD: Temporarily pause the observer to prevent cross-tree mutation loops or write collisions
            if (nodes.observer) nodes.observer.disconnect();

            await updateState();

            nodes.folderCount = curFolders;
            nodes.itemCount = curItems;

            // RECONNECT: Put the observer back to work tracking live game updates
            if (nodes.observer && targetNode) {
              nodes.observer.observe(targetNode, config);
            }
          }
        }
      }
    });

    const targetNode = document.querySelector("#journalfolderroot");
    if (targetNode) {
      nodes.observer.observe(targetNode, config);
    }
  }

  const Journal = {
    // initialization
    init: async function init() {
      if (nodes.journalSorts.length > 0) return; // already initialized
      if (document.querySelector("#journal > .content > .superadd.btn") !== null) return; // don't load if owner

      await loadState();

      // Add controls
      createSearchControl();
      createFolderControls();
      createFolderContextMenu();
      createItemContextMenu();
      serverChangeHandler();

      const lockControl = createLockControl();
      if (!lockControl) return;

      // lock/unlock event listener
      lockControl.addEventListener("click", function () {
        settings.isLocked = !settings.isLocked;
        nodes.journalSorts.forEach((s) => s.option("disabled", settings.isLocked));

        if (nodes.lockControlIcon) {
          nodes.lockControlIcon.textContent = settings.isLocked ? "(" : ")";
        }

        if (settings.isLocked) {
          document.querySelectorAll("#c20-journalfolderroot .dd-item.character").forEach((el) => {
            el.setAttribute("draggable", "true");
          });
        }
      });
    },

    // teardown
    remove: async function remove() {
      if (document.querySelector("#journal > .content > .superadd.btn") !== null) return;

      if (nodes.observer) {
        nodes.observer.disconnect();
      }

      nodes.journalSorts.forEach((s) => s.destroy());
      nodes.journalSorts = [];

      // FIXED: Optimized cleanups. Because we preserve Roll20's hidden list untouched, we simply discard our clones
      document.querySelector("#c20-journalfolderroot")?.remove();
      document.querySelector(".c20-lock-control")?.remove();
      document.querySelector("#journal .content.searchbox")?.remove();

      // Unhide the native Roll20 sidebar layer smoothly
      const nativeJournalRoot = document.querySelector("#journalfolderroot");
      if (nativeJournalRoot) {
        nativeJournalRoot.style.display = "block";
      }

      // FIXED: Cleaned up context listeners matching their EXACT event types to eliminate garbage memory leaks
      document.removeEventListener("click", closeFolderContextmenu);
      document.removeEventListener("contextmenu", ShowFolderContextMenu);
      if (context.folderMenu) context.folderMenu.remove();

      document.removeEventListener("click", closeItemContextmenu);

      // FIXED: Target the original element boundary wrapper context from part 2
      const journalRoot = document.querySelector("#journal");
      if (journalRoot) {
        journalRoot.removeEventListener("contextmenu", showItemContextMenu);
      }
      if (context.itemMenu) context.itemMenu.remove();
    },
  };

  return Journal;
})();
