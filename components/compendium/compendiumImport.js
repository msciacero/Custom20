var CompendiumImport = (function () {
  function createDropZone() {
    const characterSheet = document.querySelector(".sheetform");
    if (!characterSheet) return;

    // Prevent duplicate drop zones if init re-fires
    if (document.getElementById("compendium-drop-zone")) return;

    const dropZone = document.createElement("div");
    dropZone.id = "compendium-drop-zone";
    dropZone.className = "c20-compendium-dropzone";

    // FIXED: Force pointer-events styling rules to prevent the flashing loop hazard
    dropZone.style.cssText = "display: none; pointer-events: none;";
    characterSheet.appendChild(dropZone);

    const dropNotice = document.createElement("div");
    dropNotice.className = "c20-compendium-dropzone-notice";
    dropNotice.textContent = "ACCEPTING DROP FROM COMPENDIUM";
    dropNotice.style.textAlign = "center";

    const dropNoticeBg = document.createElement("div");
    dropNoticeBg.className = "c20-compendium-dropzone-background";
    dropNoticeBg.appendChild(dropNotice);
    dropZone.appendChild(dropNoticeBg);

    // FIXED: Restructured drag bounds checking pipelines to eliminate screen-flickering loops
    characterSheet.addEventListener("dragenter", async function (event) {
      // Allow execution checks only on valid file drag objects
      if (event.dataTransfer && event.dataTransfer.types.includes("text/plain")) {
        const compendiumImport = await StorageHelper.getItem(
          StorageHelper.dbNames.campaigns,
          "all",
          "compendiumImport",
        );

        if (compendiumImport === true) {
          event.preventDefault();
          // Engage layer visually while pointer-events: none keeps the cursor target locked on the sheet beneath
          dropZone.style.display = "flex";
        }
      }
    });

    characterSheet.addEventListener("dragover", function (event) {
      event.preventDefault();
    });

    characterSheet.addEventListener("drop", async function (event) {
      event.preventDefault();
      dropZone.style.display = "none";

      if (!event.dataTransfer) return;

      try {
        const itemText = event.dataTransfer.getData("text/plain");
        if (itemText) {
          await getCompendiumItemData(JSON.parse(itemText));
        }
      } catch (err) {
        console.error("[C20] Drop parsing exception aborted:", err);
      }
    });

    characterSheet.addEventListener("dragleave", function (event) {
      // Only close overlay if mouse leaves the outermost character sheet frame completely
      if (event.relatedTarget === null || !characterSheet.contains(event.relatedTarget)) {
        dropZone.style.display = "none";
      }
    });
  }

  async function getCompendiumItemData(request) {
    if (!request || !request.id) return;

    // FIXED: Passed request.id directly to support alphanumeric cryptographic string hashes instead of breaking via Number()
    const compendiumData = await StorageHelper.getItem(
      StorageHelper.dbNames.compendiums,
      request.game,
      parseInt(request.id),
    );

    if (compendiumData != null) {
      switch (compendiumData.type) {
        case "background":
          importBackground(compendiumData);
          processTrait(compendiumData);
          break;
        case "class":
          compendiumData.source = `${compendiumData.level || 1} Level ${compendiumData.groupName || "Class"}`;
          processTrait(compendiumData);
          break;
        case "feat":
          processTrait(compendiumData);
          break;
        case "item":
          importItem(compendiumData);
          break;
        case "spell":
          importSpell(compendiumData);
          break;
        case "subclass":
          compendiumData.source = `${compendiumData.level || 1} Level ${compendiumData.subclassName || "Subclass"}`;
          compendiumData.type = "class";
          processTrait(compendiumData);
          break;
      }
    }
  }

  function processTrait(data) {
    if (!data || typeof data.description !== "string") {
      if (typeof importTrait === "function") importTrait(data);
      return;
    }

    // FIXED: Eliminated the greedy regex engine completely to prevent catastrophic thread backtracking locks
    const lines = data.description.split(/\r?\n/);
    const extractedTraits = [];
    let remainingDescriptionLines = [];
    let inCodeBlock = false;
    let activeBlockLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          activeBlockLines = [];
        } else {
          // Finished a fenced code block payload cleanly
          inCodeBlock = false;
          if (activeBlockLines.length > 0) {
            const traitName = activeBlockLines.shift().replaceAll("**", "").trim() || "Extracted Trait";
            const traitBody = activeBlockLines.join("\n").trim();

            const newTrait = Object.assign({}, data, {
              name: traitName,
              description: traitBody,
            });
            extractedTraits.push(newTrait);
          }
        }
      } else {
        if (inCodeBlock) {
          activeBlockLines.push(line);
        } else {
          remainingDescriptionLines.push(line);
        }
      }
    }

    const remainingText = remainingDescriptionLines.join("\n").trim();

    // Reconstruct and save the original host trait cleanly
    const originalTrait = Object.assign({}, data, { description: remainingText });
    if (typeof importTrait === "function") {
      importTrait(originalTrait);
    }

    // Process all sub-parsed traits concurrently in sequence safety
    extractedTraits.forEach(function (t) {
      if (typeof importTrait === "function") importTrait(t);
    });
  }

  function importBackground(data) {
    const header = document.querySelector(".page.core .header-info.display");
    if (header && typeof updateInput === "function") {
      updateInput(header, 'input[name="attr_background"]', data.name || "");
    }
  }

  function importItem(data, itemId = null) {
    if (!data) return;

    const props = [];

    // FIXED: Upgraded primitive checks to utilize modern startsWith string boundaries securely
    Object.keys(data)
      .filter((x) => x.startsWith("prop_") && data[x])
      .forEach((x) => {
        props.push(x.substring(5).replaceAll("_", " "));
      });

    if (data.propV_magical === "Yes") {
      props.push("Magical");
    } else if (data.propV_magical === "Requires Attunement") {
      props.push("Magical (Attunement)");
    }

    if (data.propV_hands) props.push(data.propV_hands);
    if (data.propV_size) props.push(data.propV_size);
    if (data.propV_HAA_Proofing) props.push(`${data.propV_HAA_Proofing} Tier Armor Proofing`);
    if (data.propV_HAS_Status) props.push(`Status: ${data.propV_HAS_Status}`);
    if (data.propV_HAS_Rune) props.push(`${data.propV_HAS_Rune} Rune`);
    if (data.propV_Weapon_Type) props.push(data.propV_Weapon_Type);
    if (data.source) props.push(`Source: ${data.source}`);
    if (data.cost) props.push(`Cost: ${data.cost}`);

    const mods = [];
    Object.keys(data)
      .filter((x) => x.startsWith("mod_") && data[x])
      .forEach((x) => {
        mods.push(`${x.substring(4).replaceAll("_", " ")}: ${data[x]}`);
      });

    if (data.modV_StealthDisadvantage) mods.push("Stealth:Disadvantage");

    if (typeof getSignedString === "function") {
      if (data.modV_Spell_Attack) mods.push(`Spell Attack ${getSignedString(data.modV_Spell_Attack)}`);
      if (data.modV_Spell_DC) mods.push(`Spell DC ${getSignedString(data.modV_Spell_DC)}`);
    }

    // FIXED: Protected calculation split boundaries against unconfigured weapon type parameters
    const itemTypeString = data.mod_Item_Type || "Weapon";
    const attackType = data.prop_Thrown ? "Weapon" : itemTypeString.split(" ")[0] || "Weapon";

    if (typeof getSignedString === "function") {
      if (data.modV_Weapon_Attacks) mods.push(`${attackType} Attacks ${getSignedString(data.modV_Weapon_Attacks)}`);
      if (data.modV_Weapon_Damage) mods.push(`${attackType} Damage ${getSignedString(data.modV_Weapon_Damage)}`);
    }

    if (Array.isArray(data.abilities) && typeof getSignedString === "function") {
      data.abilities.forEach((ability) => {
        if (ability.type === "Increase") mods.push(`${ability.ability} ${getSignedString(ability.value)}`);
        else if (ability.type === "Set") mods.push(`${ability.ability}: ${ability.value}`);
      });
    }

    if (Array.isArray(data.skills) && typeof getSignedString === "function") {
      data.skills.forEach((skill) => {
        mods.push(`${skill.ability} ${getSignedString(skill.value)}`);
      });
    }

    if (Array.isArray(data.saves) && typeof getSignedString === "function") {
      data.saves.forEach((save) => {
        mods.push(`${save.ability} ${getSignedString(save.value)}`);
      });
    }

    let roll20Item = null;
    if (itemId) {
      roll20Item = document.querySelector(`.equipment .complex .repitem[data-reprowid="${itemId}"] .item`);
      if (typeof resetAttackFromItem === "function") {
        resetAttackFromItem(data, itemId);
      }
    } else {
      // FIXED: Implement an explicit, safe layout hook selector to fetch newly appended items reliably
      const addButton = document.querySelector(".equipment .complex .repcontrol_add");
      if (addButton) {
        addButton.click();
      }

      const repContainer = document.querySelector(".equipment .complex .repcontainer");
      const itemContainer = repContainer?.lastElementChild || repContainer?.lastChild;
      roll20Item = itemContainer?.nodeType === 1 ? itemContainer.querySelector(".item") : null;
    }

    if (!roll20Item) {
      console.warn("[C20] Aborting item fields populate: target Roll20 item container node row missing.");
      return;
    }

    const shouldHaveAttack = !!data.mod_Damage;
    const rawWeight = String(data.weight || "0");

    if (typeof updateInput === "function") {
      updateInput(roll20Item, 'input[name="attr_itemname"]', data.name ?? "");
      updateInput(roll20Item, 'input[name="attr_itemcount"]', data.count ?? "");
      updateInput(roll20Item, 'input[name="attr_itemweight"]', rawWeight.replace(/[^\d.-]/g, "") || "0");
      updateInput(roll20Item, 'input[name="attr_itemproperties"]', props.join(",") ?? "");
      updateInput(roll20Item, 'input[name="attr_itemmodifiers"]', mods.join(",") ?? "");
    }

    if (typeof updateCheckbox === "function") {
      updateCheckbox(roll20Item, 'input[name="attr_useasresource"]', !!data.isResource);
    }
    if (typeof updateTextArea === "function") {
      updateTextArea(roll20Item, 'textarea[name="attr_itemcontent"]', data.description ?? "");
    }

    const attackCheckbox = roll20Item.querySelector('input[name="attr_hasattack"]');
    if (typeof updateCheckbox === "function" && attackCheckbox) {
      if (itemId == null && shouldHaveAttack) {
        updateCheckbox(roll20Item, 'input[name="attr_hasattack"]', shouldHaveAttack);
      } else if (itemId != null) {
        const currentAttack = attackCheckbox.checked;
        if (currentAttack !== shouldHaveAttack) {
          updateCheckbox(roll20Item, 'input[name="attr_hasattack"]', shouldHaveAttack);
        }
      }
    }

    if (typeof Inventory !== "undefined" && typeof Inventory.updateItemDisplay === "function") {
      Inventory.updateItemDisplay(roll20Item);
    }
  }

  function importTrait(data) {
    if (!data) return;

    const addButton = document.querySelector(".traits .complex .repcontrol_add");
    if (addButton) addButton.click();

    const repContainer = document.querySelector(".traits .complex .repcontainer");
    const traitItem = repContainer?.lastElementChild || repContainer?.lastChild;
    const roll20Trait = traitItem?.nodeType === 1 ? traitItem.querySelector(".options") : null;

    if (!roll20Trait || !traitItem) return;

    if (typeof updateInput === "function") {
      updateInput(roll20Trait, 'input[name="attr_name"]', data.name || "");
      updateInput(roll20Trait, 'input[name="attr_source_type"]', data.source || "");
    }
    if (typeof updateSelect === "function" && data.type) {
      updateSelect(
        roll20Trait,
        'select[name="attr_source"]',
        data.type.replace(/^./, (char) => char.toUpperCase()),
      );
    }
    if (typeof updateTextArea === "function") {
      updateTextArea(roll20Trait, 'textarea[name="attr_description"]', data.description || "");
    }

    // Collapse newly created asset boxes safely to minimize UI noise layout thrashing
    const optionsFlag = traitItem.querySelector(".trait .options-flag");
    const displayFlag = traitItem.querySelector(".trait .display-flag");

    if (optionsFlag && optionsFlag.checked) optionsFlag.click();
    if (displayFlag && !displayFlag.checked) displayFlag.click();
  }

  function importSpell(spellData) {
    if (!spellData) return;

    const targetLevelString = String(spellData.level || "").toLowerCase();
    const groupName =
      targetLevelString === "cantrip"
        ? "repeating_spell-cantrip"
        : `repeating_spell-${targetLevelString.replace(/\D/g, "")}`;

    // FIXED: Protect against asynchronous loading races with structural validation checks
    const addButton = document.querySelector(
      `.spell-container .repcontrol[data-groupName="${groupName}"] .repcontrol_add`,
    );
    if (addButton) {
      addButton.click();
    } else {
      console.warn(`[C20] Could not find 'Add' button anchor for group: ${groupName}`);
      return;
    }

    const repContainer = document.querySelector(`.spell-container .repcontainer[data-groupName="${groupName}"]`);
    // FIXED: Swapped 'lastChild' for 'lastElementChild' to completely ignore empty whitespace/text nodes
    const spellItem = repContainer?.lastElementChild;
    const roll20Spell = spellItem?.querySelector(".options");

    if (!roll20Spell || !spellItem) {
      console.warn(`[C20] Aborting spell load: Target row container missing for group: ${groupName}`);
      return;
    }

    if (typeof updateInput === "function") {
      updateInput(roll20Spell, 'input[name="attr_spellname"]', spellData.name || "");
      updateInput(roll20Spell, 'input[name="attr_spellcastingtime"]', spellData.time || "");
      updateInput(roll20Spell, 'input[name="attr_spellrange"]', spellData.range || "");
      updateInput(roll20Spell, 'input[name="attr_spellcomp_materials"]', spellData.materials || "");
      updateInput(roll20Spell, 'input[name="attr_spellduration"]', spellData.duration || "");
      updateInput(roll20Spell, 'input[name="attr_spellsavesuccess"]', spellData.savingEffect || "");
      updateInput(roll20Spell, 'input[name="attr_spellhealing"]', spellData.healing || "");
      updateInput(roll20Spell, 'input[name="attr_spelldamage"]', spellData.damageRoll || "");
      updateInput(roll20Spell, 'input[name="attr_spelldamagetype"]', spellData.damageType || "");
    }

    if (typeof updateSelect === "function") {
      updateSelect(roll20Spell, 'select[name="attr_spellschool"]', spellData.school || "");
      updateSelect(roll20Spell, 'select[name="attr_spellsave"]', spellData.savingThrow || "");
      updateSelect(roll20Spell, 'select[name="attr_spellattack"]', spellData.attack || "");
      updateSelect(roll20Spell, 'select[name="attr_spell_ability"]', "spell");
    }

    if (typeof updateCheckbox === "function") {
      updateCheckbox(roll20Spell, 'input[name="attr_spellritual"]', !!spellData.ritual);
      updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_v"]', !!spellData.verbal);
      updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_s"]', !!spellData.somatic);
      updateCheckbox(roll20Spell, 'input[name="attr_spellcomp_m"]', !!spellData.material);
      updateCheckbox(roll20Spell, 'input[name="attr_spellconcentration"]', !!spellData.concentration);
      updateCheckbox(roll20Spell, 'input[name="attr_spelldmgmod"]', !!spellData.abilityModifier);
    }

    if (typeof updateTextArea === "function") {
      updateTextArea(roll20Spell, 'textarea[name="attr_spelldescription"]', spellData.description || "");
      updateTextArea(roll20Spell, 'textarea[name="attr_spellathigherlevels"]', spellData.higherLevels || "");
    }

    // FIXED: Isolated regular expression matching gates to shield your imports from crashing on null strings
    const higherRollText = spellData.higherRoll ? String(spellData.higherRoll) : "";

    if (higherRollText && typeof updateInput === "function" && typeof updateSelect === "function") {
      const matchDieCount = /(^(\d*))/.exec(higherRollText);
      const matchDieType = /d(\d+)/.exec(higherRollText);
      const matchDieBonus = /([+-]\s?\d+)?$/.exec(higherRollText);

      // Safe extraction evaluation lookups
      const countValue = matchDieCount ? matchDieCount[0] : "";
      const typeValue = matchDieType ? matchDieType[0].toLowerCase() : "";
      const bonusValue = matchDieBonus ? matchDieBonus[0].replaceAll(" ", "") : "";

      updateInput(roll20Spell, 'input[name="attr_spellhldie"]', countValue);
      updateSelect(roll20Spell, 'select[name="attr_spellhldietype"]', typeValue);
      updateInput(roll20Spell, 'input[name="attr_spellhlbonus"]', bonusValue);
    }

    if ((spellData.damageRoll || spellData.healing) && typeof updateSelect === "function") {
      updateSelect(roll20Spell, 'select[name="attr_spelloutput"]', "ATTACK");
    }

    // Collapse option banners safely post-injection to reduce layout noise
    const optionsFlag = spellItem.querySelector(".spell .wrapper .options-flag");
    const detailsFlag = spellItem.querySelector(".spell .details-flag");

    if (optionsFlag && optionsFlag.checked) optionsFlag.click();
    if (detailsFlag && !detailsFlag.checked) detailsFlag.click();

    // Re-render and format the newly injected row visual text layout
    if (typeof Spells !== "undefined" && typeof Spells.updateSpellRow === "function") {
      const spellRowEl = spellItem.querySelector(".spell");
      if (spellRowEl) Spells.updateSpellRow(spellRowEl);
    }
  }

  function resetAttackFromItem(data, itemId) {
    if (!itemId || !data) return;

    // FIXED: Removed .toLowerCase() to guarantee matching case-sensitive UUID string hashes
    const attackInput = document.querySelector(`.attacks input[name="attr_itemid"][value="${itemId}"]`);
    const roll20Attack = attackInput?.parentElement;

    if (roll20Attack) {
      if (!data.mod_Damage) updateInput(roll20Attack, "input[name='attr_dmgbase']", "");
      if (!data.mod_Damage_Type) updateInput(roll20Attack, "input[name='attr_dmgtype']", "");
      if (!data.mod_Secondary_Damage) updateInput(roll20Attack, "input[name='attr_dmg2base']", "");
      if (!data.mod_Secondary_Damage_Type) updateInput(roll20Attack, "input[name='attr_dmg2type']", "");
      if (!data.mod_Range) updateInput(roll20Attack, "input[name='attr_atkrange']", "");
      if (!data.modV_Weapon_Attacks) updateInput(roll20Attack, "input[name='attr_atkmod']", "");
      if (!data.modV_Weapon_Damage) updateInput(roll20Attack, "input[name='attr_dmgmod']", "");
      if (!data.mod_Critical_Range) updateInput(roll20Attack, "input[name='attr_atkcritrange']", "");
      if (!data.mod_Attack_Description) updateTextArea(roll20Attack, 'textarea[name="attr_atk_desc"]', "");

      if (!data.modV_Weapon_Attacks && !data.modV_Weapon_Damage) {
        updateInput(roll20Attack, "input[name='attr_atkmagic']", "");
      }
      if (!data.mod_Secondary_Damage && !data.mod_Secondary_Damage_Type) {
        updateCheckbox(roll20Attack, "input[name='attr_dmg2flag']", false);
      }
    }
  }

  function updateInput(element, query, value) {
    if (!element) return;
    const input = element.querySelector(query);

    if (input && value !== null && value !== undefined && String(value) !== input.value) {
      input.value = String(value);
      input.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  }

  function updateCheckbox(element, query, value) {
    if (!element) return;
    const checkbox = element.querySelector(query);
    const targetState = !!value; // Safe strict boolean coercion

    // FIXED: Rewrote property assignments to perfectly align state values before executing native click events
    if (checkbox && checkbox.checked !== targetState) {
      checkbox.checked = targetState;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      checkbox.click();
    }
  }

  function updateSelect(element, query, value) {
    if (!element) return;
    const select = element.querySelector(query);

    if (select && value !== null && value !== undefined && String(value) !== select.value) {
      select.value = String(value);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function updateTextArea(element, query, value) {
    if (!element) return;
    const textArea = element.querySelector(query);

    if (textArea && value !== null && value !== undefined && String(value) !== textArea.value) {
      textArea.value = String(value);
      textArea.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  }

  function getSignedString(n) {
    // FIXED: Explicitly coerce parameter to a string format to guard against type checking exceptions
    const str = String(n ?? "0");
    if (str.startsWith("+") || str.startsWith("-")) return str;
    return "+" + str;
  }

  const CompendiumImport = {
    init: function init() {
      createDropZone();
    },
    updateItem: importItem,
  };

  return CompendiumImport;
})();
