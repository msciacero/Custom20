var CompendiumImport = (function () {
  function createDropZone() {
    var characterSheet = document.querySelector(".sheetform");

    var dropZone = document.createElement("div");
    dropZone.id = "compendium-drop-zone";
    dropZone.className = "c20-compendium-dropzone";
    characterSheet.appendChild(dropZone);

    var dropNotice = document.createElement("div");
    dropNotice.className = "c20-compendium-dropzone-notice";
    dropNotice.textContent = "ACCEPTING DROP FROM COMPENDIUM";
    dropNotice.style.textAlign = "center";

    var dropNoticeBg = document.createElement("div");
    dropNoticeBg.className = "c20-compendium-dropzone-background";
    dropNoticeBg.appendChild(dropNotice);
    dropZone.appendChild(dropNoticeBg);

    characterSheet.addEventListener("dragenter", async function (event) {
      var localStorage = await chrome.storage.local.get("compendiumImport");
      if (localStorage.compendiumImport === true) {
        event.preventDefault();
        dropZone.style.display = "flex";
      }
    });

    dropZone.addEventListener("dragover", async function (event) {
      event.preventDefault();
    });

    dropZone.addEventListener("drop", async function (event) {
      event.preventDefault();
      dropZone.style.display = "none";
      var item = event.dataTransfer.getData("text/plain");
      await getCompendiumItemData(JSON.parse(item));
    });

    dropZone.addEventListener("dragleave", function (event) {
      //event.preventDefault();
      dropZone.style.display = "none";
    });
  }

  async function getCompendiumItemData(request) {
    var compendiumData = await StorageHelper.getItem(
      StorageHelper.dbNames.compendiums,
      request.game,
      Number(request.id)
    );

    if (compendiumData != null) {
      switch (compendiumData.type) {
        case "background":
          importBackground(compendiumData);
          processTrait(compendiumData);
          break;
        case "feat":
          processTrait(compendiumData);
          break;
        case "spell":
          importSpell(compendiumData);
          break;
      }
    }
  }

  function processTrait(data) {
    // Parse fenced markdown code blocks (```...```) in the description and
    // create separate traits for each block. The first line of the code block
    // becomes the trait name and the rest becomes the description for that
    // trait. Any text outside of code blocks remains as the original trait's
    // description. Remove any end-of-line characters immediately after a
    // code block.
    if (!data || typeof data.description !== "string") {
      importTrait(data);
      return;
    }

    var desc = data.description;
    var codeBlockRegex = /```([\s\S]*?)```(?:\r?\n)*/g;
    var extractedTraits = [];

    // Remove code blocks and collect their content
    var remaining = desc.replace(codeBlockRegex, function (_, inner) {
      // Trim leading/trailing blank lines from inner content
      var content = inner.replace(/^(\r?\n)+/, "").replace(/(\r?\n)+$/, "");
      var lines = content.split(/\r?\n/);
      var name = (lines.shift() || "").trim();
      var rest = lines.join("\n").trim();

      // Build a new trait object using same fields as original
      var newTrait = Object.assign({}, data, {
        name: name.replaceAll("**", ""),
        description: rest,
      });

      extractedTraits.push(newTrait);

      // Remove the code block and any following EOLs from the description
      return "";
    });

    // Trim whitespace left in the remaining description
    remaining = remaining.replace(/^\s+/, "").replace(/\s+$/, "");

    // Import the original trait with the remaining description
    var originalTrait = Object.assign({}, data, { description: remaining });
    importTrait(originalTrait);

    // Import extracted traits first
    extractedTraits.forEach(function (t) {
      importTrait(t);
    });
  }

  function importBackground(data) {
    var header = document.querySelector(".page.core .header-info.display");
    updateInput(header, 'input[name="attr_background"]', data.name);
  }

  function importTrait(data) {
    document.querySelector(".traits .complex .repcontrol_add").click();

    var traitItem = document.querySelector(".traits .complex .repcontainer").lastChild;
    var roll20Trait = traitItem.querySelector(".options");
    updateInput(roll20Trait, 'input[name="attr_name"]', data.name);
    updateSelect(
      roll20Trait,
      'select[name="attr_source"]',
      data.type.replace(/^./, (char) => char.toUpperCase())
    );
    updateInput(roll20Trait, 'input[name="attr_source_type"]', data.source);
    updateTextArea(roll20Trait, 'textarea[name="attr_description"]', data.description);

    // uncheck option and info to minimize
    traitItem.querySelector(".trait .options-flag").click();
    traitItem.querySelector(".trait .display-flag").click();
  }

  function importSpell(spellData) {
    var groupName =
      spellData.level === "cantrip"
        ? `repeating_spell-cantrip`
        : `repeating_spell-${spellData.level.replace(/\D/g, "")}`;
    document.querySelector(`.spell-container .repcontrol[data-groupName="${groupName}"] .repcontrol_add`).click();

    var spellItem = document.querySelector(`.spell-container .repcontainer[data-groupName="${groupName}"]`).lastChild;
    var roll20Spell = spellItem.querySelector(".options");
    updateInput(roll20Spell, 'input[name="attr_spellname"]', spellData.name);
    updateSelect(roll20Spell, 'select[name="attr_spellschool"]', spellData.school);
    updateCheckbox(roll20Spell, 'input[name="attr_spellritual"]', spellData.ritual);
    updateInput(roll20Spell, 'input[name="attr_spellcastingtime"]', spellData.time);
    updateInput(roll20Spell, 'input[name="attr_spellrange"]', spellData.range);
    updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_v"]', spellData.verbal);
    updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_s"]', spellData.somatic);
    updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_m"]', spellData.material);
    updateInput(roll20Spell, 'input[name="attr_spellcomp_materials"]', spellData.materials);
    updateCheckbox(roll20Spell, 'input[name="attr_spellconcentration"]', spellData.concentration);
    updateInput(roll20Spell, 'input[name="attr_spellduration"]', spellData.duration);
    updateTextArea(roll20Spell, 'textarea[name="attr_spelldescription"]', spellData.description);
    updateTextArea(roll20Spell, 'textarea[name="attr_spellathigherlevels"]', spellData.higherLevels);
    updateSelect(roll20Spell, 'select[name="attr_spellsave"]', spellData.savingThrow);
    updateInput(roll20Spell, 'input[name="attr_spellsavesuccess"]', spellData.savingEffect);
    updateSelect(roll20Spell, 'select[name="attr_spellattack"]', spellData.attack);
    updateSelect(roll20Spell, 'select[name="attr_spell_ability"]', "spell");
    updateInput(roll20Spell, 'input[name="attr_spellhealing"]', spellData.healing);
    updateInput(roll20Spell, 'input[name="attr_spelldamage"]', spellData.damageRoll);
    updateInput(roll20Spell, 'input[name="attr_spelldamagetype"]', spellData.damageType);
    updateCheckbox(roll20Spell, 'input[name="attr_spelldmgmod"]', spellData.abilityModifier);

    updateInput(roll20Spell, 'input[name="attr_spellhldie"]', /(^(\d*))/.exec(spellData.higherRoll)?.[0] ?? "");
    updateSelect(
      roll20Spell,
      'select[name="attr_spellhldietype"]',
      /d(\d+)/.exec(spellData.higherRoll)?.[0]?.toLowerCase() ?? ""
    );
    updateInput(
      roll20Spell,
      'input[name="attr_spellhlbonus"]',
      /([+-]\s?\d+)?$/.exec(spellData.higherRoll)?.[0]?.replaceAll(" ", "") ?? ""
    );

    if (spellData.damageRoll || spellData.healing)
      updateSelect(roll20Spell, 'select[name="attr_spelloutput"]', "ATTACK");

    // uncheck spell option and info to minimize
    spellItem.querySelector(".spell .wrapper .options-flag").click();
    spellItem.querySelector(".spell .details-flag").click();

    Spells.updateSpellRow(spellItem.querySelector(".spell"));
  }

  function updateInput(element, query, value) {
    var input = element.querySelector(query);
    if (input && value) {
      input.value = value;
      input.dispatchEvent(new Event("blur"));
    }
  }

  function updateCheckbox(element, query, value) {
    var checkbox = element.querySelector(query);
    if (checkbox) {
      checkbox.checked = !value;
      checkbox.click();
    }
  }

  function updateSelect(element, query, value) {
    var select = element.querySelector(query);
    if (select && value) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function updateTextArea(element, query, value) {
    var textArea = element.querySelector(query);
    if (textArea && value) {
      textArea.value = value;
      textArea.dispatchEvent(new Event("blur"));
    }
  }

  var CompendiumImport = {
    // initialization
    init: function init() {
      createDropZone();
    },
  };
  return CompendiumImport;
})();
