//--Adds additional functionality to Roll20 Journal UI--
//create, rename, and delete folders
//reogranize items and folders
//hide/show folders and items
//search for an item with the option to include hidden items in the search
//loads/saves state to local storage

var settings = {
  searchHidden: false,
  isLocked: true,
  storageId: "",
};

var context = {
  folderMenu: null,
  itemMenu: null,
  curEl: null,
};

var controller = {
  searchFilter: "",
};

var nodes = {
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
  lockControl.className = "el-button";
  lockControl.style.position = "absolute";
  lockControl.style.right = "10px";

  nodes.lockControlIcon = document.createElement("span");
  nodes.lockControlIcon.className = "pictos";
  nodes.lockControlIcon.textContent = "(";
  lockControl.appendChild(nodes.lockControlIcon);

  var header = document.querySelector("#journal-creation-controls");
  if (header) {
    header.appendChild(lockControl);
  }

  return lockControl;
}

function createSearchControl() {
  let wrapper = document.createElement("div");
  wrapper.className = "content searchbox";

  let searchBar = document.createElement("input");
  searchBar.type = "text";
  searchBar.placeholder = "Search by name...";
  searchBar.style.width = "calc(100% - 60px)";
  searchBar.style.paddingRight = "20px";
  searchBar.className = "ui-autocomplete-input";
  searchBar.autocomplete = "off";

  let hiddenToggle = document.createElement("a");
  hiddenToggle.className = "btn pictos";
  hiddenToggle.href = "#hiddenSearch";
  hiddenToggle.style.float = "right";
  hiddenToggle.style.opacity = settings.searchHidden ? "1.0" : "0.4";
  hiddenToggle.textContent = "E";
  hiddenToggle.title = "Ignore Hidden";

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
  let items = document.querySelectorAll("#journalfolderroot .journalitem.dd-item");
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

  // hide folders that don't have any visible items
  let folders = document.querySelectorAll("#journalfolderroot .dd-folder");
  folders.forEach((folder) => {
    let hasVisible = folder.querySelectorAll(".dd-list .journalitem.dd-item:not(.c20-search-hidden)").length > 0;
    if (hasVisible) {
      folder.classList.remove("c20-search-hidden");
    } else {
      folder.classList.add("c20-search-hidden");
    }
  });

  let root = document.querySelector("#journalfolderroot");
  if (controller.searchFilter === "" || settings.searchHidden === false) {
    root.classList.remove("c20-search-all");
  } else {
    root.classList.add("c20-search-all");
  }
}

//sorting
function addJournalSort() {
  var el = document.querySelectorAll("#journalfolderroot .dd-list");

  for (let i = 0; i < el.length; i++) {
    var s = Sortable.create(el[i], {
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
}

function removeJournalSort() {
  for (let i = 0; i < nodes.journalSorts.length; i++) {
    nodes.journalSorts[i].destroy();
  }
  nodes.journalSorts = [];
}

// context menus
function createFolderContextMenu() {
  context.folderMenu = document.createElement("div");
  context.folderMenu.className = "d20contextmenu";
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

  document.addEventListener("click", function (event) {
    context.folderMenu.style.display = "none";
  });

  document.addEventListener("contextmenu", function (event) {
    if (!event.target.className.includes("dd-content") && !event.target.className.includes("folder-title")) {
      context.folderMenu.style.display = "none";
    } else {
      event.preventDefault();
      displayFolderContextMenu(event);
    }
  });

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
    } else if (actionType === "rename") {
      renameFolder();
    } else if (actionType === "remove") {
      context.curEl.remove();
    } else if (actionType === "hide") {
      context.curEl.classList.add("c20-hidden");
    } else if (actionType === "show") {
      var hiddenParents = context.curEl.parentElement.closest(".c20-hidden");
      if (hiddenParents) {
        if (confirm("Item is inside a hidden folder. Unhidding this item will also unhide all parent folders.")) {
          while (hiddenParents) {
            hiddenParents.classList.remove("c20-hidden");
            hiddenParents = hiddenParents.closest(".c20-hidden");
          }
          context.curEl.classList.remove("c20-hidden");
        }
      } else {
        context.curEl.classList.remove("c20-hidden");
      }
    } else if (actionType === "toggle") {
      let root = document.querySelector("#journalfolderroot");
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

  document.addEventListener("click", function (event) {
    context.itemMenu.style.display = "none";
  });

  document.addEventListener("contextmenu", function (event) {
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
  });

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
    } else if (actionType === "notes") {
      // Future functionality??
    } else if (actionType === "hide") {
      context.curEl.classList.add("c20-hidden");
    } else if (actionType === "show") {
      var hiddenParents = context.curEl.parentElement.closest(".c20-hidden");
      if (hiddenParents) {
        if (confirm("Item is inside a hidden folder. Unhidding this item will also unhide all parent folders.")) {
          while (hiddenParents) {
            hiddenParents.classList.remove("c20-hidden");
            hiddenParents = hiddenParents.closest(".c20-hidden");
          }
          context.curEl.classList.remove("c20-hidden");
        }
      } else {
        context.curEl.classList.remove("c20-hidden");
      }
    } else if (actionType === "toggle") {
      let root = document.querySelector("#journalfolderroot");
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
  if (data.isCollapsed) newList.style.display = "none";

  var newFolder = document.createElement("li");
  newFolder.className = "dd-item dd-folder";
  newFolder.setAttribute("data-globalfolderid", data.id);
  if (data.isCollapsed) newFolder.classList.add("dd-collapsed");

  content.appendChild(contentTitle);
  newFolder.appendChild(collapseControl);
  newFolder.appendChild(expandControl);
  newFolder.appendChild(sortHandle);
  newFolder.appendChild(content);
  newFolder.appendChild(newList);

  return newFolder;
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

// saving
function saveState() {
  var folders = Array.from(document.querySelectorAll("#journalfolderroot"));
  folders = folders.concat(Array.from(document.querySelectorAll("#journalfolderroot .dd-item.dd-folder")));

  //create directory structure with important data elements
  const saveData = Array.from(folders).map((folder) => {
    return {
      id: folder.getAttribute("data-globalfolderid"),
      name: folder.querySelector(".folder-title").textContent,
      pf: folder.parentElement.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid"),
      isCollapsed: folder.classList.contains("dd-collapsed"),
      items: Array.from(folder.querySelector("ol").children).map((item) => {
        if (item.classList.contains("dd-folder"))
          return {
            type: "folder",
            id: item.getAttribute("data-globalfolderid"),
            isHidden: item.classList.contains("c20-hidden"),
          };
        return { type: "item", id: item.getAttribute("data-itemid"), isHidden: item.classList.contains("c20-hidden") };
      }),
    };
  });

  localStorage.setItem(settings.storageId, LZString.compressToUTF16(JSON.stringify(saveData)));
  console.log("save");
}

// loading
function loadState() {
  var storedData = localStorage.getItem(settings.storageId);
  if (storedData === null) return;

  var savedData = JSON.parse(LZString.decompressFromUTF16(storedData));

  // check for missing items
  var curItems = Array.from(document.querySelectorAll("#journalfolderroot .journalitem.dd-item")).map((x) =>
    x.getAttribute("data-itemid")
  );
  var savedItems = savedData.flatMap((x) => x.items.filter((y) => y.type == "item").map((y) => y.id));
  var newItems = curItems.filter((x) => !savedItems.includes(x));

  if (newItems) {
    // group new items by parent folder
    newItems = newItems.map((item) => {
      var elm = document.querySelector(`[data-itemid="${item}"]`).closest(".dd-item.dd-folder");
      return {
        id: item,
        pf: elm?.getAttribute("data-globalfolderid") ?? null,
        gf: elm.parentElement.closest(".dd-item.dd-folder")?.getAttribute("data-globalfolderid") ?? null,
      };
    });
    newItems = Object.groupBy(newItems, ({ pf }) => pf);

    Object.keys(newItems).forEach((folderId) => {
      //check if folder is saved
      var folderIndex = savedData.findIndex((x) => x.id === folderId);
      if (folderIndex !== -1) {
        newItems[folderId].forEach((item) => {
          savedData[folderIndex].items.push({ type: "item", id: item.id, isHidden: false });
        });
      } else {
        // check if this is sub folder to existing saved folder, otherwise point to root
        folderIndex = savedData.findIndex((x) => x.id === newItems[folderId][0].gf);
        if (folderIndex === -1) folderIndex = 0;

        savedData[folderIndex].items.push({ type: "folder", id: folderId, isHidden: false });
        savedData.push({
          id: folderId,
          name: document.querySelector(`[data-globalfolderid="${folderId}"] .folder-title`).textContent,
          pf: newItems[folderId][0].gf,
          isCollapsed: false,
          items: newItems[folderId].map((item) => {
            return { type: "item", id: item.id, isHidden: false };
          }),
        });
      }
    });
  }

  var list = document.createElement("ol");
  list.classList.add("dd-list");

  var root = document.createElement("div");
  root.appendChild(list);

  var folders = savedData.reduce((obj, x) => {
    if (x.id !== null) obj[x.id] = createNewFolder(x);
    return obj;
  }, {});

  for (var i = 0; i < savedData.length; i++) {
    const folderInfo = savedData[i];

    //folder
    var folder = folders[folderInfo.id];
    if (folderInfo.id === null) folder = root;

    //items in folder
    for (var j = 0; j < folderInfo.items.length; j++) {
      const itemInfo = folderInfo.items[j];

      var item;
      if (itemInfo.type === "item") {
        item = document.querySelector(`#journalfolderroot [data-itemid="${itemInfo.id}"]`);
      } else {
        item = folders[itemInfo.id];
      }

      if (itemInfo.isHidden) item.classList.add("c20-hidden");

      folder.querySelector("ol").appendChild(item);
    }
  }

  var journalRoot = document.querySelector("#journalfolderroot");
  journalRoot.replaceChildren(root.querySelector("ol"));

  nodes.folderCount = document.querySelectorAll("#journalfolderroot .dd-item.dd-folder").length;
  nodes.itemCount = document.querySelectorAll("#journalfolderroot .journalitem.dd-item").length;
}

// monitor folder changes for client or server side updates
// client: add & remove folder, collapse & expand folders
// server: add & remove folders and items
function changeHandler() {
  const ignoreClass = ["folder-title"];
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.target.className !== "folder-title") {
        //Item or Folder added/remove
        var isUpdate = false;
        var curFolders = document.querySelectorAll("#journalfolderroot .dd-item.dd-folder").length;
        var curItems = document.querySelectorAll("#journalfolderroot journalitem.dd-item").length;

        if (curFolders != nodes.folderCount) {
          removeJournalSort();
          addJournalSort();
          nodes.folderCount = curFolders;
          isUpdate = true;
        }

        if (curItems != nodes.itemCount) {
          nodes.itemCount = curItems;
          isUpdate = true;
        }

        if (isUpdate) saveState();
      } else if (mutation.type === "attributes" && mutationClassChange(mutation, "dd-collapsed")) {
        // Collapse/Expand
        saveState();
      } else if (mutation.type === "attributes" && mutationClassChange(mutation, "c20-hidden")) {
        // hide/show
        saveState();
      }
    }
  });

  const targetNode = document.getElementById("journalfolderroot"); // Or any other DOM element
  const config = {
    childList: true, // Observe additions/removals of child nodes
    subtree: true, // Observe changes in descendants of the target node
    attributes: true,
    attributeFilter: ["class"], // Collapse/Expand attribute
    attributeOldValue: true,
  };

  observer.observe(targetNode, config);
}

function mutationClassChange(mutation, value) {
  if (mutation.target.className.includes(value) && !mutation.oldValue.includes(value)) return true;
  if (!mutation.target.className.includes(value) && mutation.oldValue.includes(value)) return true;
  return false;
}

// initialization
function waitForElement(selector) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);
  });
}

function init() {
  settings.storageId = "c20-journal-" + String(campaign_id);
  if (nodes.journalSorts.length > 0) return; // already initialized
  if (document.querySelectorAll("#journal > .content > .superadd.btn").length !== 0) return; // don't load if owner
  loadState();

  // Add controls
  addJournalSort();
  createSearchControl();
  createFolderContextMenu();
  createItemContextMenu();
  changeHandler();
  var lockControl = createLockControl();

  // lock/unlock event listener
  lockControl.addEventListener("click", function () {
    settings.isLocked = !nodes.journalSorts[0].option("disabled");
    nodes.journalSorts.forEach((s) => s.option("disabled", settings.isLocked));
    nodes.lockControlIcon.textContent = settings.isLocked ? "(" : ")";
  });
}

// Usage
waitForElement("#journalfolderroot .dd-list").then((element) => {
  init();
});

// TODO: Notes functionality
// TODO: Detect ingame folder updates
