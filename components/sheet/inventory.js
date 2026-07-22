var Inventory = (function () {
  function createUi(e) {
    if (e.target.classList.contains("inventorysubflag") && e.target.checked) {
      e.target.checked = false;
      var itemId = e.target.parentElement.parentElement.getAttribute("data-reprowid");
      var itemData = getItemData(itemId);

      var wrapper = document.createElement("div");
      wrapper.className = "item-editor-wrapper";
      wrapper.setAttribute("data-itemid", itemId);
      wrapper.appendChild(createItemEditor(itemData));

      new CardModal("Inventory Item", wrapper, updateItemData, { width: "540px" });
    }
  }

  function getItemData(itemId) {
    var itemRow = document.querySelector(`.repcontainer .repitem[data-reprowid="${itemId}"] .item`);
    var data = {
      name: itemRow.querySelector('input[name="attr_itemname"]').value,
      count: itemRow.querySelector('input[name="attr_itemcount"]').value,
      weight: itemRow.querySelector('input[name="attr_itemweight"]').value,
      isResource: itemRow.querySelector('input[name="attr_useasresource"]').checked,
      description: itemRow.querySelector('textarea[name="attr_itemcontent"]').value.trim(),
    };

    var propertiesStr = itemRow.querySelector('input[name="attr_itemproperties"]').value;
    var props = propertiesStr
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x);

    var modifiersStr = itemRow.querySelector('input[name="attr_itemmodifiers"]').value;
    var mods = modifiersStr
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x);

    // Parse properties back to data fields
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
      } else if (prop.match(/^(.+) Tier Armor Proofing$/)) {
        data.propV_HAA_Proofing = RegExp.$1;
      } else if (prop.startsWith("Status: ")) {
        data.propV_HAS_Status = prop.substring(8);
      } else if (prop.match(/^(.+) Rune$/)) {
        data.propV_HAS_Rune = RegExp.$1;
      } else {
        // For other properties like Versatile, Finesse, etc.
        var key = "prop_" + prop.replace(/\s+/g, "_");
        data[key] = true;
      }
    });

    // Parse modifiers back to data fields
    var abilities = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
    var saves = [
      "Strength Save",
      "Dexterity Save",
      "Constitution Save",
      "Intelligence Save",
      "Wisdom Save",
      "Charisma Save",
      "Saving Throws",
    ];
    var skills = [
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
      } else if (mod.match(/^Spell Attack ([+-]?\d+)$/)) {
        data.modV_Spell_Attack = parseInt(RegExp.$1);
      } else if (mod.match(/^Spell DC ([+-]?\d+)$/)) {
        data.modV_Spell_DC = parseInt(RegExp.$1);
      } else if (mod.match(/^(Weapon|Melee|Ranged) Attacks[:]?\s([+-]?\d+)$/)) {
        data.modV_Weapon_Attacks = parseInt(RegExp.$2);
      } else if (mod.match(/^(Weapon|Melee|Ranged) Damage[:]?\s([+-]?\d+)$/)) {
        data.modV_Weapon_Damage = parseInt(RegExp.$2);
      } else if (saves.some((sa) => mod.startsWith(sa))) {
        var ability = saves.find((sa) => mod.startsWith(sa));
        var value = parseInt(mod.match(/([+-]?\d+)$/)[1]);
        if (!data.saves) data.saves = [];
        data.saves.push({ ability: ability, value: value });
      } else if (skills.some((sk) => mod.startsWith(sk))) {
        var ability = skills.find((sk) => mod.startsWith(sk));
        var value = parseInt(mod.match(/([+-]?\d+)$/)[1]);
        if (!data.skills) data.skills = [];
        data.skills.push({ ability: ability, value: value });
      } else if (abilities.some((ab) => mod.startsWith(ab))) {
        var ability = abilities.find((ab) => mod.startsWith(ab));
        var value = parseInt(mod.match(/([+-]?\d+)$/)[1]);
        if (!data.abilities) data.abilities = [];
        data.abilities.push({ type: mod.includes(":") ? "Set" : "Increase", ability: ability, value: value });
      } else {
        // For other modifiers
        var kv = mod.split(":").map((x) => x.trim());
        var key = "mod_" + kv[0].replace(/\s+/g, "_");
        data[key] = kv[1];
      }
    });

    // fill in missing fields with defaults
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
    var itemId = modal.querySelector(".item-editor-wrapper").getAttribute("data-itemid");
    var form = modal.querySelector(".item-editor-wrapper").querySelector("form");
    var formData = new FormData(form);
    var itemData = {};

    for (const [key, value] of formData.entries()) {
      if (key.endsWith("[]")) {
        const arrayKey = key.slice(0, -2); // Remove '[]'
        if (!itemData[arrayKey]) {
          itemData[arrayKey] = [];
        }
        itemData[arrayKey].push(value);
      } else if (key === "id") {
        itemData[key] = Number(value);
      } else {
        itemData[key] = value;
      }
    }

    itemData = constructItemAbilityData(itemData);
    CompendiumImport.updateItem(itemData, itemId);
  }

  function updateItemDisplay(item) {
    updateAccent(item.querySelector('input[name="attr_itemproperties"]'));
    updateDivider(item.querySelector('input[name="attr_itemmodifiers"]'));
  }

  function updateDivider(item) {
    if (item.value.includes("Item Type: Divider")) item.closest(".item").classList.add("c20-item-divider");
    else item.closest(".item").classList.remove("c20-item-divider");
  }

  function updateAccent(item) {
    var equippedElement = item.closest(".item").querySelector(".equipped.main");
    if (item.value.includes("Magical (Attunement)") && CharacterSettings.settings.itemAttunementColor) {
      equippedElement.style.setProperty("accent-color", CharacterSettings.settings.itemAttunementColor);
    } else if (item.value.includes("Magical") && CharacterSettings.settings.itemMagicColor) {
      equippedElement.style.setProperty("accent-color", CharacterSettings.settings.itemMagicColor);
    } else {
      equippedElement.style.removeProperty("accent-color");
    }
  }

  function updateAccents() {
    var items = Array.from(document.querySelectorAll('.equipment .repitem .item input[name="attr_itemproperties"]'));
    items.forEach((item) => updateAccent(item));
  }

  var Inventory = {
    init: function init() {
      document.querySelector(".page .equipment .complex").addEventListener("click", createUi);
      updateAccents();
      Array.from(document.querySelectorAll('.equipment .repitem .item input[name="attr_itemmodifiers"]'))
        .filter((item) => item.value.includes("Item Type: Divider"))
        .forEach((item) => updateDivider(item));
    },
    updateUi: function updateUi() {
      updateAccents();
    },
    updateItemDisplay: updateItemDisplay,
    remove: function remove() {
      document.querySelector(".page .equipment .complex").removeEventListener("click", createUi);
      Array.from(document.querySelectorAll(".c20-item-divider")).forEach((x) => x.classList.remove("c20-item-divider"));
      Array.from(document.querySelectorAll('.equipment .repitem .item input[name="attr_itemproperties"]')).forEach(
        (x) => x.style.removeProperty("accent-color"),
      );
    },
  };
  return Inventory;
})();
