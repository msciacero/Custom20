var StorageHelper = (function () {
  const dbNames = {
    compendiums: "c20-compendiums",
    characters: "c20-characters",
    campaigns: "c20-campaigns",
  };

  const compendiumNames = {
    dnd2014: "D&D 2014",
  };

  const dbConnections = {
    "c20-compendiums": null,
    "c20-characters": null,
    "c20-campaigns": null,
  };

  async function getDbConnection(dbName) {
    if (dbConnections[dbName] === null) {
      dbConnections[dbName] = await idb.openDB(dbName, undefined, {
        blocking(currentVersion, blockedVersion, event) {
          console.warn(`[${dbName}] Another tab requested an upgrade. Dropping cached connection.`);
          const dbInstance = event.target.result;
          dbInstance.close();
          dbConnections[dbName] = null;
        },
      });
    }
    return dbConnections[dbName];
  }

  async function closeDbConnection(dbName) {
    if (dbConnections[dbName] !== null) {
      dbConnections[dbName].close();
      dbConnections[dbName] = null;
    }
  }

  async function listObjectStores(dbName) {
    const db = await getDbConnection(dbName);
    return Array.from(db.objectStoreNames).sort((a, b) => a.localeCompare(b));
  }

  async function objectStoreExists(dbName, objName) {
    const db = await getDbConnection(dbName);
    return db?.objectStoreNames?.contains(objName) ?? false;
  }

  async function createObjectStoreIfNotExist(dbName, objName) {
    let db = await getDbConnection(dbName);
    if (db?.objectStoreNames?.contains(objName)) return;

    // Use a fresh read immediately before executing version changes
    const currentVersion = db?.version ?? 0;
    await closeDbConnection(dbName);

    const upgradeDb = await idb.openDB(dbName, currentVersion + 1, {
      upgrade(udp) {
        if (dbName === dbNames.compendiums) {
          const objectStore = udp.createObjectStore(objName, { keyPath: "id", autoIncrement: true });
          objectStore.createIndex("names", "names", { unique: false, multiEntry: true });
          objectStore.createIndex("type", "type", { unique: false });
        } else {
          udp.createObjectStore(objName);
        }
      },
      blocked(currentVersion, blockedVersion, event) {
        console.warn(`[${dbName}] Upgrade to v${blockedVersion} is blocked by another open tab.`);
      },
    });

    upgradeDb.close();
    dbConnections[dbName] = null;
  }

  async function exportObjectStore(dbName, objName, fileName) {
    const db = await getDbConnection(dbName);
    let cursor = await db.transaction(objName).store.openCursor();

    const data = [];
    while (cursor) {
      const itemCopy = { ...cursor.value };
      delete itemCopy.id; // Safely delete from structural clone, leaving cursor intact
      data.push(itemCopy);
      cursor = await cursor.continue();
    }

    const jsonData = JSON.stringify(data);

    try {
      const handle = await window.showSaveFilePicker({
        startIn: "downloads",
        suggestedName: fileName,
        types: [{ accept: { "application/json": [".json"] } }],
      });
      const writableStream = await handle.createWritable();
      await writableStream.write(jsonData);
      await writableStream.close();
    } catch (err) {
      if (err.name !== "AbortError") throw err;
    }
  }

  async function exportAll() {
    const exportData = {};

    for (const key in dbNames) {
      const actualDbName = dbNames[key];
      const db = await getDbConnection(actualDbName);
      const databaseData = {};

      for (const storeName of db.objectStoreNames) {
        const data = [];
        let cursor = await db.transaction(storeName).store.openCursor();
        while (cursor) {
          data.push({
            key: cursor.key,
            value: cursor.value,
          });
          cursor = await cursor.continue();
        }
        databaseData[storeName] = data;
      }
      exportData[key] = databaseData;
    }

    const jsonData = JSON.stringify(exportData);

    try {
      const handle = await window.showSaveFilePicker({
        startIn: "downloads",
        suggestedName: "c20_export.json",
        types: [{ accept: { "application/json": [".json"] } }],
      });
      const writableStream = await handle.createWritable();
      await writableStream.write(jsonData);
      await writableStream.close();
    } catch (err) {
      if (err.name !== "AbortError") throw err;
    }
  }

  async function importObjectStore(dbName, objName, data, overwrite) {
    if (!(await objectStoreExists(dbName, objName))) {
      await createObjectStoreIfNotExist(dbName, objName);
    } else {
      const db = await getDbConnection(dbName);

      const existingItems = await db.getAll(objName);
      const duplicates = [];

      for (let i = data.length - 1; i >= 0; i--) {
        const currentItem = data[i];
        const matchedItem = existingItems.find(
          (x) =>
            (x.groupName?.toLowerCase() ?? "") === (currentItem.groupName?.toLowerCase() ?? "") &&
            x.name?.toLowerCase() === currentItem.name?.toLowerCase(),
        );

        if (matchedItem) {
          if (overwrite === true) currentItem.id = matchedItem.id;
          else duplicates.push(i);
        } else {
          delete currentItem.id;
        }
      }

      duplicates.forEach((x) => data.splice(x, 1));
    }

    const db = await getDbConnection(dbName);
    const tx = db.transaction(objName, "readwrite");

    await Promise.all([...data.map((item) => tx.store.put(item)), tx.done]);
  }

  async function importAll(data) {
    for (const dbKey in data) {
      const actualDbName = dbNames[dbKey];
      if (!actualDbName) continue;

      // Gather all the object store names that need to be created for this database
      const targetStoreNames = Object.keys(data[dbKey]);
      if (targetStoreNames.length === 0) continue;

      // Fetch the current connection to read the latest version layout
      let db = await getDbConnection(actualDbName);
      const currentVersion = db.version;
      await closeDbConnection(actualDbName);

      // Perform EXACTLY ONE version upgrade to set up all stores simultaneously
      const upgradeDb = await idb.openDB(actualDbName, currentVersion + 1, {
        upgrade(udp) {
          targetStoreNames.forEach((objName) => {
            // Clean up old store if it exists
            if (udp.objectStoreNames.contains(objName)) {
              udp.deleteObjectStore(objName);
            }

            // Create the new store structure cleanly
            if (actualDbName === dbNames.compendiums) {
              const objectStore = udp.createObjectStore(objName, { keyPath: "id", autoIncrement: true });
              objectStore.createIndex("names", "names", { unique: false, multiEntry: true });
              objectStore.createIndex("type", "type", { unique: false });
            } else {
              udp.createObjectStore(objName);
            }
          });
        },
      });

      upgradeDb.close();
      dbConnections[actualDbName] = null;
      const activeDb = await getDbConnection(actualDbName);

      // Process all object store writes simultaneously
      await Promise.all(
        targetStoreNames.map(async (objName) => {
          const tx = activeDb.transaction(objName, "readwrite");
          const items = data[dbKey][objName];

          if (actualDbName === dbNames.compendiums) {
            items.forEach((item) => tx.store.put(item.value));
          } else {
            items.forEach((item) => tx.store.put(item.value, item.key));
          }

          return tx.done; // Resolves when this specific store finishes writing
        }),
      );
    }
  }

  async function deleteObjectStore(dbName, objName) {
    let db = await getDbConnection(dbName);
    if (!db.objectStoreNames.contains(objName)) return;

    const currentVersion = db.version;
    await closeDbConnection(dbName);

    const upgradeDb = await idb.openDB(dbName, currentVersion + 1, {
      upgrade(udp) {
        udp.deleteObjectStore(objName);
      },
    });
    upgradeDb.close();
    dbConnections[dbName] = null;
  }

  async function addOrUpdateItem(dbName, objName, item, key) {
    const db = await getDbConnection(dbName);
    return await db.put(objName, item, key);
  }

  async function addOrUpdateItems(dbName, objName, items) {
    const db = await getDbConnection(dbName);
    const tx = db.transaction(objName, "readwrite");
    await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
  }

  async function getItem(dbName, objName, itemId) {
    const db = await getDbConnection(dbName);
    return await db.get(objName, itemId);
  }

  async function listItemsByType(dbName, objName, typeName) {
    const db = await getDbConnection(dbName);
    return await db.getAllFromIndex(objName, "type", typeName);
  }

  async function listIndexKeys(dbName, objName, indexName) {
    const db = await getDbConnection(dbName);
    let cursor = await db.transaction(objName).store.index(indexName)?.openCursor(null, "nextunique");

    const list = [];
    while (cursor) {
      list.push(cursor.key);
      cursor = await cursor.continue();
    }
    return list;
  }

  async function deleteItem(dbName, objName, itemId) {
    const db = await getDbConnection(dbName);
    await db.delete(objName, itemId);
  }

  async function searchIndexBySubstring(dbName, objName, indexName, searchTerm) {
    const db = await getDbConnection(dbName);
    const target = searchTerm.toLowerCase();

    const tx = db.transaction(objName, "readonly");
    const index = tx.store.index(indexName);
    let cursor = await index.openCursor();

    const results = [];
    const seenIds = new Set(); // Prevents duplicates since 'names' is a multiEntry array

    while (cursor) {
      // cursor.key is the individual string inside the item's 'names' array
      const indexValue = String(cursor.key);

      if (indexValue.includes(target)) {
        const item = cursor.value;
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      }

      cursor = await cursor.continue();
    }

    return results;
  }

  async function getItemFromIndex(dbName, objectName, indexName, key) {
    const db = await getDbConnection(dbName);
    return await db.getAllFromIndex(objectName, indexName, key);
  }

  async function initCompendium() {
    const storeName = compendiumNames.dnd2014;
    if (!(await objectStoreExists(dbNames.compendiums, storeName))) {
      await createObjectStoreIfNotExist(dbNames.compendiums, storeName);

      const conditions = await fetchLibrary(browser.runtime.getURL(`library/data/dnd2014/conditions.json`));
      if (conditions && Array.isArray(conditions)) {
        conditions.forEach((c) => {
          c.type = "condition";
          c.source = "Free Basic Rules";
          c.names = [c.name?.toLowerCase() || ""];
          if (c.groupName) c.names.push(c.groupName.toLowerCase());
        });
        await addOrUpdateItems(dbNames.compendiums, storeName, conditions);
      }
    }
  }

  async function initCampaign() {
    const dbName = dbNames.campaigns;
    const campaignId = window.campaign_id;

    const hasAllStore = await objectStoreExists(dbName, "all");
    const hasCampaignStore = campaignId ? await objectStoreExists(dbName, campaignId) : true;

    if (!hasAllStore) {
      await createObjectStoreIfNotExist(dbName, "all");
    }
    if (campaignId && !hasCampaignStore) {
      await createObjectStoreIfNotExist(dbName, campaignId);
      const titleText = document.querySelector("title")?.textContent || "";
      const cleanedItemName = titleText.split("|")[0].replaceAll("\n", "").trim() || "Unknown Campaign";
      await addOrUpdateItem(dbName, campaignId, cleanedItemName, "name");
    }
  }

  async function initCharacter() {
    const dbName = dbNames.characters;
    const characterId = window.character_id;

    if (!characterId) return;

    const hasAllStore = await objectStoreExists(dbName, "all");
    const hasCharacterStore = await objectStoreExists(dbName, characterId);

    if (!hasAllStore) {
      await createObjectStoreIfNotExist(dbName, "all");
    }

    if (!hasCharacterStore) {
      await createObjectStoreIfNotExist(dbName, characterId);

      if (window.campaign_id) {
        let campaignCharacters = await getItem(dbNames.campaigns, window.campaign_id, "characters");
        if (campaignCharacters === undefined) {
          campaignCharacters = [characterId];
        } else if (Array.isArray(campaignCharacters) && !campaignCharacters.includes(characterId)) {
          campaignCharacters.push(characterId);
        }
        await addOrUpdateItem(dbNames.campaigns, window.campaign_id, campaignCharacters, "characters");
      }
    }

    const nameInput = document.querySelector("input[name='attr_character_name']");
    const characterName = nameInput?.value || "Unnamed Character";
    await addOrUpdateItem(dbName, characterId, characterName, "name");
  }

  async function fetchLibrary(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching JSON library payload:", error);
      return null;
    }
  }

  const StorageHelper = {
    initCompendium: initCompendium,
    initCampaign: initCampaign,
    initCharacter: initCharacter,
    objectStoreExists: objectStoreExists,
    listObjectStores: listObjectStores,
    createObjectStore: createObjectStoreIfNotExist,
    importObjectStore: importObjectStore,
    exportObjectStore: exportObjectStore,
    deleteObjectStore: deleteObjectStore,
    importAll: importAll,
    exportAll: exportAll,
    addOrUpdateItem: addOrUpdateItem,
    addOrUpdateItems: addOrUpdateItems,
    getItem: getItem,
    getItemFromIndex: getItemFromIndex,
    listItemsByType: listItemsByType,
    listIndexKeys: listIndexKeys,
    deleteItem: deleteItem,
    searchIndexBySubstring: searchIndexBySubstring,
    dbNames: dbNames,
  };

  return StorageHelper;
})();
