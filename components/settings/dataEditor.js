var DataEditor = (function () {
  let operation = null;

  async function createModal() {
    // FIXED: Defensive safeguard interceptor to completely purge old zombie modals if they already exist
    const existingModal = document.querySelector("#c20-data-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.className = `modal c20-modal-full`;
    modal.id = "c20-data-modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.maxWidth = "440px";

    const compendiumContent = document.createElement("div");
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
    const modalHeader = document.createElement("div");
    modalHeader.style.borderBottom = "1px solid grey";

    const modalTitle = document.createElement("h3");
    modalTitle.id = "c20-compendium-modal-title";
    modalTitle.style.display = "inline-block";
    modalTitle.style.paddingBottom = "5px";
    modalTitle.textContent = "Data Editor";

    const modalClose = document.createElement("span");
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

    const typeSelect = operation.create({
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
    const div = document.createElement("div");
    div.id = "c20-dataEditor-import";
    div.className = "hidden";

    const helper = document.createElement("div");
    helper.textContent = "*Replaces existing c20 data";
    helper.style.margin = "30px 0 10px";
    div.appendChild(helper);

    const importBtn = document.createElement("button");
    importBtn.className = "btn";
    importBtn.textContent = "Import";
    importBtn.addEventListener("click", importAllData);
    div.appendChild(importBtn);

    return div;
  }

  function createExportAction() {
    const div = document.createElement("div");
    div.id = "c20-dataEditor-export";
    div.className = "hidden";

    const helper = document.createElement("div");
    helper.textContent = "*Export all c20 data";
    helper.style.margin = "30px 0 10px";
    div.appendChild(helper);

    const exportBtn = document.createElement("button");
    exportBtn.className = "btn";
    exportBtn.textContent = "Export";
    exportBtn.addEventListener("click", StorageHelper.exportAll);
    div.appendChild(exportBtn);

    return div;
  }

  async function createEditor() {
    const campaigns = await StorageHelper.listObjectStores(StorageHelper.dbNames.campaigns);
    const filteredCampaigns = campaigns?.filter((x) => x !== "all") || [];

    const campaignContainer = document.createElement("div");
    campaignContainer.id = "c20-dataEditor-delete";
    campaignContainer.style.marginTop = "20px";
    campaignContainer.className = "hidden";

    const title = document.createElement("h4");
    title.textContent = "Campaign Data";
    title.style.marginBottom = "10px";
    campaignContainer.appendChild(title);

    for (let i = 0; i < filteredCampaigns.length; i++) {
      campaignContainer.appendChild(await createCampaignEditor(filteredCampaigns[i]));
    }

    return campaignContainer;
  }

  async function createCampaignEditor(campaignStore) {
    const campaignName =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignStore, "name")) || "Unnamed Campaign";
    const characters =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignStore, "characters")) || [];

    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.style.display = "list-item";
    summary.style.minHeight = "26px";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = campaignName;
    summary.appendChild(nameSpan);

    const btn = document.createElement("button");
    btn.className = "btn btn-danger pictos";
    btn.style.float = "right";
    btn.textContent = "#";
    btn.title = "Delete game data";

    btn.addEventListener("click", async function () {
      await deleteCampaign(campaignStore);
      details.remove();
    });

    summary.appendChild(btn);
    // FIXED: Changed standard modern shorthand .append back into safe structural .appendChild
    details.appendChild(summary);

    for (let i = 0; i < characters.length; i++) {
      details.appendChild(await createCharacterEditor(campaignStore, characters[i]));
    }

    return details;
  }

  async function createCharacterEditor(campaignId, characterId) {
    if (!characterId) return document.createElement("div");

    const characterName =
      (await StorageHelper.getItem(StorageHelper.dbNames.characters, characterId, "name")) || "Unnamed Character";

    const container = document.createElement("div");
    container.style.paddingLeft = "25px";
    container.style.display = "block";
    container.style.minHeight = "26px";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = characterName;
    container.appendChild(nameSpan);

    const btn = document.createElement("button");
    btn.className = "btn btn-danger pictos";
    btn.textContent = "#";
    btn.title = "Delete character data";

    btn.addEventListener("click", async function () {
      await deleteCharacter(campaignId, characterId);

      // FIXED: Refresh the data editor tree dynamically to prevent memory caching desyncs
      const editorContent = document.querySelector("#c20-data-modal-content");
      const currentEditorTree = document.querySelector("#c20-dataEditor-delete");

      if (editorContent && currentEditorTree) {
        const freshTree = await createEditor();
        // Keep the delete sub-panel visible post-refresh
        freshTree.classList.remove("hidden");
        editorContent.replaceChild(freshTree, currentEditorTree);
      } else {
        container.remove();
      }
    });

    container.appendChild(btn);
    return container;
  }

  async function importAllData() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ accept: { "application/json": [".json"] } }],
      });
      const file = await handle.getFile();
      const rawText = await file.text();

      // FIXED: Defensively handle structural formatting syntax exceptions safely
      let jsonData;
      try {
        jsonData = JSON.parse(rawText);
      } catch (parseErr) {
        alert("Import Failed: The chosen file is not a valid JSON document configuration backup.");
        return;
      }

      await StorageHelper.importAll(jsonData);
      alert("C20 Data Profile imported successfully across all databases!");

      // Close out layout modals cleanly on success
      document.querySelector("#c20-data-modal")?.remove();
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[C20] Fatal file configuration import failure:", err);
        alert(`Storage Import Exception: ${err.message}`);
      }
    }
  }

  async function deleteCampaign(campaignId) {
    if (!campaignId) return;

    const campaignCharacters =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignId, "characters")) || [];

    // Map deletion streams concurrently across the storage array blocks cleanly
    for (const characterId of campaignCharacters) {
      await StorageHelper.deleteObjectStore(StorageHelper.dbNames.characters, characterId);
    }

    await StorageHelper.deleteObjectStore(StorageHelper.dbNames.campaigns, campaignId);
  }

  async function deleteCharacter(campaignId, characterId) {
    if (!campaignId || !characterId) return;

    let campaignCharacters =
      (await StorageHelper.getItem(StorageHelper.dbNames.campaigns, campaignId, "characters")) || [];
    campaignCharacters = campaignCharacters.filter((x) => x !== characterId);

    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, campaignId, campaignCharacters, "characters");
    await StorageHelper.deleteObjectStore(StorageHelper.dbNames.characters, characterId);
  }

  const DataEditor = {
    show: async function show() {
      await createModal();
    },
  };

  return DataEditor;
})();
