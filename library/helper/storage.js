var StorageHelper = (function () {
  const dbNames = {
    compendiums: "compendiums",
    characters: "characters",
    campaigns: "campaigns",
  };

  const compendiumNames = {
    dnd2014: "D&D 2014",
  };

  const dbConnections = {
    compendiums: null,
    characters: null,
    campaigns: null,
  };

  async function getDbConnection(dbName) {
    if (dbConnections[dbName] === null) dbConnections[dbName] = await idb.openDB(dbName);
    return dbConnections[dbName];
  }

  async function closeDbConnection(dbName) {
    if (dbConnections[dbName] !== null) {
      await dbConnections[dbName].close();
      dbConnections[dbName] = null;
    }
  }

  async function listObjectStores(dbName) {
    var db = await getDbConnection(dbName);
    return Array.from(db.objectStoreNames).sort((a, b) => {
      return a.localeCompare(b);
    });
  }

  async function objectStoreExists(dbName, objName) {
    var db = await getDbConnection(dbName);
    return db.objectStoreNames.contains(objName);
  }

  async function createObjectStoreIfNotExist(dbName, objName) {
    var db = await getDbConnection(dbName);
    if (db.objectStoreNames.contains(objName)) return;

    var version = db.version;
    await closeDbConnection(dbName);

    db = await idb.openDB(dbName, version + 1, {
      upgrade(udp) {
        if (dbName === dbNames.compendiums) {
          var objectStore = udp.createObjectStore(objName, { keyPath: "id", autoIncrement: true });
          objectStore.createIndex("names", "names", { unique: false, multiEntry: true });
          objectStore.createIndex("type", "type", { unique: false });
        } else {
          var objectStore = udp.createObjectStore(objName);
        }
      },
    });
    db.close();
  }

  async function exportObjectStore(dbName, objName, fileName) {
    var db = await getDbConnection(dbName);
    var cursor = await db.transaction(objName).store.openCursor();

    const data = [];
    while (cursor) {
      delete cursor.id;
      data.push(cursor.value);
      cursor = await cursor.continue();
    }

    const jsonData = JSON.stringify(data);
    const handle = await window.showSaveFilePicker({
      startIn: "downloads",
      suggestedName: fileName,
      types: [{ accept: { "application/json": [".json"] } }],
    });
    const writableStream = await handle.createWritable();
    await writableStream.write(jsonData);
    await writableStream.close();
  }

  async function importObjectStore(dbName, objName, data, overwrite) {
    if (!(await objectStoreExists(dbName, objName))) {
      await createObjectStoreIfNotExist(dbName, objName);
    } else {
      var duplicates = [];
      var db = await getDbConnection(dbName);

      for (var i = data.length - 1; i >= 0; i--) {
        var s = await db.getAllFromIndex(objName, "names", data[i].name?.toLowerCase());
        var id = s.find(
          (x) =>
            x.groupName?.toLowerCase() === data[i].groupName?.toLowerCase() &&
            x.name?.toLowerCase() === data[i].name?.toLowerCase()
        )?.id;

        if (id) {
          if (overwrite === true) data[i].id = id;
          else duplicates.push(i);
        } else if (data[i].id !== undefined) {
          delete data[i].id;
        }
      }

      duplicates.forEach((x) => data.splice(x, 1));
    }

    var db = await getDbConnection(dbName);
    var tx = db.transaction(objName, "readwrite");
    await Promise.all([
      data.forEach((item) => {
        tx.store.put(item);
      }),
      tx.done,
    ]);
  }

  async function deleteObjectStore(dbName, objName) {
    var db = await getDbConnection(dbName);
    if (!db.objectStoreNames.contains(objName)) return;

    var version = db.version;
    await closeDbConnection(dbName);

    db = await idb.openDB(dbName, version + 1, {
      upgrade(udp) {
        udp.deleteObjectStore(objName);
      },
    });
    db.close();
  }

  async function addOrUpdateItem(dbName, objName, item, key) {
    var db = await getDbConnection(dbName);
    await db.put(objName, item, key);
  }

  async function addOrUpdateItems(dbName, objName, items) {
    var db = await getDbConnection(dbName);
    var tx = db.transaction(objName, "readwrite");
    await Promise.all([
      items.forEach((item) => {
        tx.store.put(item);
      }),
      tx.done,
    ]);
  }

  async function getItem(dbName, objName, itemId) {
    var db = await getDbConnection(dbName);
    return await db.get(objName, itemId);
  }

  async function listItemsByType(dbName, objName, typeName) {
    var db = await getDbConnection(dbName);
    return await db.getAllFromIndex(objName, "type", typeName);
  }

  async function listIndexKeys(dbName, objName, indexName) {
    var db = await getDbConnection(dbName);
    var cursor = await db.transaction(objName).store.index(indexName).openCursor(null, "nextunique");

    var list = [];

    while (cursor) {
      list.push(cursor.key);
      cursor = await cursor.continue();
    }

    return list;
  }

  async function deleteItem(dbName, objName, itemId) {
    var db = await getDbConnection(dbName);
    await db.delete(objName, itemId);
  }

  async function searchObjectByIndex(dbName, objectName, indexName, searchValue) {
    var db = await getDbConnection(dbName);
    return await db.getAllFromIndex(objectName, indexName, searchValue);
  }

  async function initCompendium() {
    if (!(await objectStoreExists(dbNames.compendiums, compendiumNames.dnd2014))) {
      await createObjectStoreIfNotExist(dbNames.compendiums, compendiumNames.dnd2014);
      var conditions = await fetchLibrary(chrome.runtime.getURL(`library/data/dnd2014/conditions.json`));
      conditions.forEach((c) => {
        c.type = "condition";
        c.source = "Free Basic Rules";
        c.names = [c.name.toLowerCase()];
        if (c.groupName !== "") c.names.push(c.groupName.toLowerCase());
      });
      await addOrUpdateItems(dbNames.compendiums, compendiumNames.dnd2014, conditions);
    }
  }

  async function initCampaign() {
    if (!(await objectStoreExists(dbNames.campaigns, window.campaign_id))) {
      await createObjectStoreIfNotExist(dbNames.campaigns, window.campaign_id);
      var item = document.querySelector("title").textContent.split("|")[0].replaceAll("\n", "").trim();
      await addOrUpdateItem(dbNames.campaigns, window.campaign_id, item, "name");
    }
  }

  async function initCharacter() {
    if (!(await objectStoreExists(dbNames.characters, window.character_id))) {
      await createObjectStoreIfNotExist(dbNames.characters, window.character_id);

      var campaignCharacters = await getItem(dbNames.campaigns, window.campaign_id, "characters");
      if (campaignCharacters === undefined) campaignCharacters = [window.character_id];
      else if (!campaignCharacters.includes(window.character_id)) campaignCharacters.push(window.character_id);
      await addOrUpdateItem(dbNames.campaigns, window.campaign_id, campaignCharacters, "characters");
    }

    // Simple name update
    var name = document.querySelector("input[name='attr_character_name']").value;
    await addOrUpdateItem(dbNames.characters, window.character_id, name, "name");
  }

  async function fetchLibrary(url) {
    try {
      var response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching JSON:", error);
    }
  }

  var StorageHelper = {
    initCompendium: initCompendium,
    initCampaign: initCampaign,
    initCharacter: initCharacter,
    objectStoreExists: objectStoreExists,
    listObjectStores: listObjectStores,
    createObjectStore: createObjectStoreIfNotExist,
    importObjectStore: importObjectStore,
    exportObjectStore: exportObjectStore,
    deleteObjectStore: deleteObjectStore,
    addOrUpdateItem: addOrUpdateItem,
    addOrUpdateItems: addOrUpdateItems,
    getItem: getItem,
    listItemsByType: listItemsByType,
    listIndexKeys: listIndexKeys,
    deleteItem: deleteItem,
    searchObjectByIndex: searchObjectByIndex,
    dbNames: dbNames,
  };
  return StorageHelper;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return StorageHelper;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = StorageHelper;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("StorageHelper", []).factory("StorageHelper", function () {
    return StorageHelper;
  });
}
