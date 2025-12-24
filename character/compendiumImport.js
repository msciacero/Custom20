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
        case "spell":
          importSpell(compendiumData);
          break;
      }
    }
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
    updateSelect(roll20Spell, 'select[name="attr_spellattack"]', spellData.attack);
    updateSelect(roll20Spell, 'select[name="attr_spell_ability"]', "spell");
    updateInput(roll20Spell, 'input[name="attr_spellhealing"]', spellData.healing);
    updateInput(roll20Spell, 'input[name="attr_spelldamage"]', spellData.damage);
    updateInput(roll20Spell, 'input[name="attr_spelldamagetype"]', spellData.damageType);

    if (spellData.damage || spellData.healing) updateSelect(roll20Spell, 'select[name="attr_spelloutput"]', "ATTACK");

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

if (typeof define === "function" && define.amd) {
  define(function () {
    return CompendiumImport;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = CompendiumImport;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("CompendiumImport", []).factory("CompendiumImport", function () {
    return CompendiumImport;
  });
}
