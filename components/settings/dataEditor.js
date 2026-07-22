var DataEditor = (function () {
  let operation = null;

  async function createModal() {
    var modal = document.createElement("div");
    modal.className = `modal c20-modal-full`;
    modal.id = "c20-data-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.maxWidth = "440px";

    var compendiumContent = document.createElement("div");
    compendiumContent.id = "c20-data-modal-content";
    compendiumContent.style.marginTop = "10px";
    compendiumContent.style.maxHeight = "calc(100vh - 400px)";
    compendiumContent.style.overflowY = "auto";

    compendiumContent.appendChild(createSelector());
    compendiumContent.appendChild(createImportAction());
    compendiumContent.appendChild(createExportAction());
    compendiumContent.appendChild(await createEditor());

    modalContent.appendChild(createModalHeader());
    modalContent.appendChild(compendiumContent);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    modal.style.display = "block";
  }

  function createModalHeader() {
    var modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-compendium-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Data Editor";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    modalClose.onclick = function () {
      const modalTarget = document.querySelector("#c20-data-modal");
      if (modalTarget) modalTarget.remove();
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);

    return modalHeader;
  }

  function createSelector() {
    operation = new c20FieldSelect();

    var typeSelect = operation.create({
      name: "operation",
      title: "Operation",
      options: [
        { text: "Import Data", value: "import" },
        { text: "Export Data", value: "export" },
        { text: "Delete Data", value: "delete" },
      ],
      changeHandler: async function () {
        document.querySelector("#c20-dataEditor-import")?.classList.add("hidden");
        document.querySelector("#c20-dataEditor-export")?.classList.add("hidden");
        document.querySelector("#c20-dataEditor-delete")?.classList.add("hidden");

        const selectedVal = operation.getValue();
        if (selectedVal === "import") {
          document.querySelector("#c20-dataEditor-import")?.classList.remove("hidden");
        } else if (selectedVal === "export") {
          document.querySelector("#c20-dataEditor-export")?.classList.remove("hidden");
        } else if (selectedVal === "delete") {
          document.querySelector("#c20-dataEditor-delete")?.classList.remove("hidden");
        }
      },
    });

    return typeSelect;
  }

  function createImportAction() {
    var div = document.createElement("div");
    div.id = "c20-dataEditor-import";
    div.className = "hidden";

    var helper = document.createElement("div");
    helper.textContent = "*Replaces existing c20 data";
    helper.style.margin = "30px 0 10px";
    div.appendChild(helper);

    var importBtn = document.createElement("button");
    importBtn.className = "btn";
    importBtn.textContent = "Import";
    importBtn.addEventListener("click", importAllData);
    div.appendChild(importBtn);

    return div;
  }

  function createExportAction() {
    var div = document.createElement("div");
    div.id = "c20-dataEditor-export";
    div.className = "hidden";

    var helper = document.createElement("div");
    helper.textContent = "*Export all c20 data";
    helper.style.margin = "30px 0 10px";
    div.appendChild(helper);

    var exportBtn = document.createElement("button");
    exportBtn.className = "btn";
    exportBtn.textContent = "Export";
    exportBtn.addEventListener("click", StorageHelper.exportAll);
    div.appendChild(exportBtn);

    return div;
  }

  async function createEditor() {
    var campaigns = await StorageHelper.listObjectStores(StorageHelper.dbNames.campaigns);
    campaigns = campaigns?.filter((x) => x !== "all") || [];

    var campaignContainer = document.createElement("div");
    campaignContainer.id = "c20-dataEditor-delete";
    campaignContainer.style.marginTop = "20px";
    campaignContainer.className = "hidden";

    var title = document.createElement("h4");
    title.textContent = "Campaign Data";
    title.style.marginBottom = "10px";
    campaignContainer.appendChild(title);

    for (let i = 0; i < campaigns.length; i++) {
      campaignContainer.appendChild(await createCampaignEditor(campaigns[i]));
    }

    return campaignContainer;
  }

  async function createCampaignEditor(campaignStore) {
    var campaignName =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignStore, "name")) || "Unnamed Campaign";
    var characters = (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignStore, "characters")) || [];

    var details = document.createElement("details");

    var summary = document.createElement("summary");
    summary.style.display = "list-item";
    summary.style.minHeight = "26px";

    var nameSpan = document.createElement("span");
    nameSpan.textContent = campaignName;
    summary.appendChild(nameSpan);

    var btn = document.createElement("button");
    btn.className = "btn btn-danger pictos";
    btn.style.float = "right";
    btn.textContent = "#";
    btn.title = "Delete game data";
    btn.addEventListener("click", async function () {
      await deleteCampaign(campaignStore);
      details.remove();
    });

    summary.appendChild(btn);
    details.append(summary);

    for (let i = 0; i < characters.length; i++) {
      details.appendChild(await createCharacterEditor(campaignStore, characters[i]));
    }

    return details;
  }

  async function createCharacterEditor(campaignId, characterId) {
    var characterName =
      (await StorageHelper.getItem(StorageHelper.dbNames.characters, characterId, "name")) || "Unnamed Character";

    var container = document.createElement("div");
    container.style.paddingLeft = "25px";
    container.style.display = "block";
    container.style.minHeight = "26px";

    var nameSpan = document.createElement("span");
    nameSpan.textContent = characterName;
    container.appendChild(nameSpan);

    var btn = document.createElement("button");
    btn.className = "btn btn-danger pictos";
    btn.textContent = "#";
    btn.title = "Delete character data";
    btn.addEventListener("click", async function () {
      await deleteCharacter(campaignId, characterId);
      container.remove();
    });
    container.appendChild(btn);

    return container;
  }

  async function importAllData() {
    try {
      var [handle] = await window.showOpenFilePicker({
        types: [{ accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      var jsonData = JSON.parse(await file.text());
      await StorageHelper.importAll(jsonData);
    } catch (err) {
      if (err.name !== "AbortError") throw err;
    }
  }

  async function deleteCampaign(campaignId) {
    var campaignCharacters =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignId, "characters")) || [];

    for (const characterId of campaignCharacters) {
      await StorageHelper.deleteObjectStore(StorageHelper.dbNames.characters, characterId);
    }

    await StorageHelper.deleteObjectStore(StorageHelper.dbNames.campaigns, campaignId);
  }

  async function deleteCharacter(campaignId, characterId) {
    var campaignCharacters =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignId, "characters")) || [];
    campaignCharacters = campaignCharacters.filter((x) => x !== characterId);
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, campaignId, campaignCharacters, "characters");

    await StorageHelper.deleteObjectStore(StorageHelper.dbNames.characters, characterId);
  }

  var DataEditor = {
    show: async function show() {
      await createModal();
    },
  };
  return DataEditor;
})();
