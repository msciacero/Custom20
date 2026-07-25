var Inventory = (function () {
  function createUi(e) {
    if (e.target.classList.contains("inventorysubflag") && e.target.checked) {
      e.target.checked = false;

      const parentRow = e.target.closest(".repitem");
      if (!parentRow) return;

      const itemId = parentRow.getAttribute("data-reprowid");
      if (!itemId) return;

      const itemData = getItemData(itemId);
      if (!itemData) return;

      const wrapper = document.createElement("div");
      wrapper.className = "item-editor-wrapper";
      wrapper.setAttribute("data-itemid", itemId);
      wrapper.appendChild(createItemEditor(itemData));

      new CardModal("Inventory Item", wrapper, updateItemData, { width: "540px" });
    }
  }

  function getItemData(itemId) {
    const itemRow = document.querySelector(`.repcontainer .repitem[data-reprowid="${itemId}"] .item`);
    if (!itemRow) return null;

    const data = {
      name: itemRow.querySelector('input[name="attr_itemname"]')?.value || "",
      count: itemRow.querySelector('input[name="attr_itemcount"]')?.value || "0",
      weight: itemRow.querySelector('input[name="attr_itemweight"]')?.value || "0",
      isResource: itemRow.querySelector('input[name="attr_useasresource"]')?.checked || false,
      description: itemRow.querySelector('textarea[name="attr_itemcontent"]')?.value?.trim() || "",
    };

    const propertiesStr = itemRow.querySelector('input[name="attr_itemproperties"]')?.value || "";
    const props = propertiesStr
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const modifiersStr = itemRow.querySelector('input[name="attr_itemmodifiers"]')?.value || "";
    const mods = modifiersStr
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    props.forEach(function (prop) {
      if (prop === "Magical") {
        data.propV_magical = "Yes";
      } else if (prop === "Magical (Attunement)") {
        data.propV_magical = "Requires Attunement";
      } else if (prop === "Simple" || prop === "Martial") {
        data.propV_Weapon_Type = prop;
      } else if (prop === "Two-Handed" || prop === "Versatile") {
        data.propV_hands = prop;
      } else if (prop === "Light" || prop === "Heavy") {
        data.propV_size = prop;
      } else if (prop.startsWith("Source: ")) {
        data.source = prop.substring(8);
      } else if (prop.startsWith("Cost: ")) {
        data.cost = prop.substring(6);
      } else if (prop.startsWith("Status: ")) {
        data.propV_HAS_Status = prop.substring(8);
      } else {
        const armorMatch = prop.match(/^(.+) Tier Armor Proofing$/);
        const runeMatch = prop.match(/^(.+) Rune$/);

        if (armorMatch) {
          data.propV_HAA_Proofing = armorMatch[1];
        } else if (runeMatch) {
          data.propV_HAS_Rune = runeMatch[1];
        } else {
          const key = "prop_" + prop.replace(/\s+/g, "_");
          data[key] = true;
        }
      }
    });

    const abilities = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
    const saves = [
      "Strength Save",
      "Dexterity Save",
      "Constitution Save",
      "Intelligence Save",
      "Wisdom Save",
      "Charisma Save",
      "Saving Throws",
    ];
    const skills = [
      "Acrobatics",
      "Animal Handling",
      "Arcana",
      "Athletics",
      "Deception",
      "History",
      "Insight",
      "Intimidation",
      "Investigation",
      "Medicine",
      "Nature",
      "Perception",
      "Performance",
      "Persuasion",
      "Religion",
      "Sleight of Hand",
      "Stealth",
      "Survival",
      "Ability Checks",
    ];

    mods.forEach(function (mod) {
      if (mod === "Stealth:Disadvantage") {
        data.modV_StealthDisadvantage = "on";
        return;
      }

      const spellAttackMatch = mod.match(/^Spell Attack ([+-]?\d+)$/);
      const spellDCMatch = mod.match(/^Spell DC ([+-]?\d+)$/);
      const weaponAttackMatch = mod.match(/^(Weapon|Melee|Ranged) Attacks[:]?\s([+-]?\d+)$/);
      const weaponDamageMatch = mod.match(/^(Weapon|Melee|Ranged) Damage[:]?\s([+-]?\d+)$/);

      if (spellAttackMatch) {
        data.modV_Spell_Attack = parseInt(spellAttackMatch[1], 10);
      } else if (spellDCMatch) {
        data.modV_Spell_DC = parseInt(spellDCMatch[1], 10);
      } else if (weaponAttackMatch) {
        data.modV_Weapon_Attacks = parseInt(weaponAttackMatch[2], 10);
      } else if (weaponDamageMatch) {
        data.modV_Weapon_Damage = parseInt(weaponDamageMatch[2], 10);
      } else if (saves.some((sa) => mod.startsWith(sa))) {
        const ability = saves.find((sa) => mod.startsWith(sa));
        const numMatch = mod.match(/([+-]?\d+)$/);
        if (numMatch) {
          if (!data.saves) data.saves = [];
          data.saves.push({ ability: ability, value: parseInt(numMatch[1], 10) });
        }
      } else if (skills.some((sk) => mod.startsWith(sk))) {
        const ability = skills.find((sk) => mod.startsWith(sk));
        const numMatch = mod.match(/([+-]?\d+)$/);
        if (numMatch) {
          if (!data.skills) data.skills = [];
          data.skills.push({ ability: ability, value: parseInt(numMatch[1], 10) });
        }
      } else if (abilities.some((ab) => mod.startsWith(ab))) {
        const ability = abilities.find((ab) => mod.startsWith(ab));
        const numMatch = mod.match(/([+-]?\d+)$/);
        if (numMatch) {
          if (!data.abilities) data.abilities = [];
          data.abilities.push({
            type: mod.includes(":") ? "Set" : "Increase",
            ability: ability,
            value: parseInt(numMatch[1], 10),
          });
        }
      } else {
        const kv = mod.split(":").map((x) => x.trim());
        const key = "mod_" + kv[0].replace(/\s+/g, "_");
        data[key] = kv[1] || "";
      }
    });

    // Enforce safe initial fallbacks
    if (!data.propV_magical) data.propV_magical = "";
    if (!data.propV_HAA_Proofing) data.propV_HAA_Proofing = "";
    if (!data.propV_HAS_Status) data.propV_HAS_Status = "";
    if (data.propV_Weapon_Type) {
      if (!data.propV_hands) data.propV_hands = "";
      if (!data.propV_size) data.propV_size = "";
    }

    return data;
  }

  function updateItemData(modal) {
    const wrapper = modal.querySelector(".item-editor-wrapper");
    if (!wrapper) return;

    const itemId = wrapper.getAttribute("data-itemid");
    const form = wrapper.querySelector("form");
    if (!form) return;

    const formData = new FormData(form);
    const itemData = {};

    for (const [key, value] of formData.entries()) {
      if (key.endsWith("[]")) {
        const arrayKey = key.slice(0, -2);
        if (!itemData[arrayKey]) itemData[arrayKey] = [];
        itemData[arrayKey].push(value);
      } else if (key === "id") {
        itemData[key] = Number(value);
      } else {
        itemData[key] = value;
      }
    }

    const compiledData = constructItemAbilityData(itemData);
    CompendiumImport.updateItem(compiledData, itemId);
  }

  function updateItemDisplay(item) {
    if (!item) return;
    updateAccent(item.querySelector('input[name="attr_itemproperties"]'));
    updateDivider(item.querySelector('input[name="attr_itemmodifiers"]'));
  }

  function updateDivider(itemInput) {
    if (!itemInput) return;
    const itemRow = itemInput.closest(".item");
    if (!itemRow) return;

    if (itemInput.value.includes("Item Type: Divider")) {
      itemRow.classList.add("c20-item-divider");
    } else {
      itemRow.classList.remove("c20-item-divider");
    }
  }

  function updateAccent(itemInput) {
    if (!itemInput) return;
    const itemRow = itemInput.closest(".item");
    if (!itemRow) return;

    const equippedElement = itemRow.querySelector(".equipped.main");
    if (!equippedElement) return;

    // Pull config safely using our property getter from yesterday
    const targetSettings =
      typeof CharacterSettings.settings === "function" ? CharacterSettings.settings() : CharacterSettings.settings;

    if (itemInput.value.includes("Magical (Attunement)") && targetSettings?.itemAttunementColor) {
      equippedElement.style.setProperty("accent-color", targetSettings.itemAttunementColor);
    } else if (itemInput.value.includes("Magical") && targetSettings?.itemMagicColor) {
      equippedElement.style.setProperty("accent-color", targetSettings.itemMagicColor);
    } else {
      equippedElement.style.removeProperty("accent-color");
    }
  }

  function updateAccents() {
    const items = document.querySelectorAll('.equipment .repitem .item input[name="attr_itemproperties"]');
    items.forEach((item) => updateAccent(item));
  }

  const Inventory = {
    init: function init() {
      const complexContainer = document.querySelector(".page .equipment .complex");

      if (complexContainer) {
        complexContainer.addEventListener("click", createUi);
      } else {
        console.warn("[C20] Could not attach listener: '.page .equipment .complex' anchor node missing.");
      }

      updateAccents();

      document.querySelectorAll('.equipment .repitem .item input[name="attr_itemmodifiers"]').forEach((item) => {
        if (item.value.includes("Item Type: Divider")) {
          updateDivider(item);
        }
      });
    },

    updateUi: function updateUi() {
      updateAccents();
    },

    updateItemDisplay: updateItemDisplay,

    remove: function remove() {
      const complexContainer = document.querySelector(".page .equipment .complex");
      if (complexContainer) {
        complexContainer.removeEventListener("click", createUi);
      }

      document.querySelectorAll(".c20-item-divider").forEach((x) => x.classList.remove("c20-item-divider"));

      document.querySelectorAll(".equipment .repitem .item .equipped.main").forEach((x) => {
        x.style.removeProperty("accent-color");
      });
    },
  };

  return Inventory;
})();
