function createItemEditor(data) {
  if (!data) return document.createElement("form");

  const editor = document.createElement("form");
  editor.className = "c20-form";
  editor.style.cssText = "margin: 20px 0 30px 0;";

  if (typeof createTextInput === "function") {
    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name || "", required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source || "", required: false }));
  }

  const itemGroup = document.createElement("div");
  itemGroup.className = "c20-col-4";

  if (typeof createSelectInput === "function") {
    itemGroup.appendChild(
      createSelectInput({
        name: "mod_Item_Type",
        title: "Type",
        value: data.mod_Item_Type,
        required: false,
        options: [
          { name: "Ammunition", value: "Ammunition" },
          { name: "Light Armor", value: "Light Armor" },
          { name: "Medium Armor", value: "Medium Armor" },
          { name: "Heavy Armor", value: "Heavy Armor" },
          { name: "Shield", value: "Shield" },
          { name: "Melee Weapon", value: "Melee Weapon" },
          { name: "Ranged Weapon", value: "Ranged Weapon" },
          { name: "Divider", value: "Divider" },
        ],
      }),
    );
  }

  if (typeof createTextInput === "function") {
    itemGroup.appendChild(
      createTextInput({ name: "count", title: "Quantity", value: data.count ?? 1, required: true }),
    );
    itemGroup.appendChild(
      createTextInput({ name: "weight", title: "Weight", value: data.weight ?? "", placeHolder: "1" }),
    );
    itemGroup.appendChild(createTextInput({ name: "cost", title: "Cost", value: data.cost ?? "", placeHolder: "20g" }));
  }
  editor.appendChild(itemGroup);

  if (typeof createRadioInputGroup === "function") {
    editor.appendChild(
      createRadioInputGroup({
        title: "Magical",
        name: "propV_magical",
        options: [
          { value: "", name: "No" },
          { value: "Yes", name: "Yes" },
          { value: "Requires Attunement", name: "Attunement" },
        ],
        selectedValue: data.propV_magical,
        inline: true,
      }),
    );
  }

  if (typeof createCheckboxInput === "function") {
    editor.appendChild(createCheckboxInput({ name: "isResource", title: "Create Resource", value: !!data.isResource }));
  }

  if (typeof createTextAreaInput === "function") {
    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description || "",
        required: false,
        height: 180,
      }),
    );
  }

  const abilities = document.createElement("div");
  abilities.appendChild(createAbilityProperties(data));
  abilities.appendChild(createSaveProperties(data));
  abilities.appendChild(createSkillProperties(data));

  const heavyArmsNote = document.createElement("div");
  heavyArmsNote.style.cssText = "font-style: italic; margin-bottom: 10px;";
  heavyArmsNote.textContent = "This is only for tracking upgrades. It does not modify item stats.";

  const heavyArms = document.createElement("div");
  heavyArms.appendChild(heavyArmsNote);

  if (typeof createArmorerArmorProperties === "function") heavyArms.appendChild(createArmorerArmorProperties(data));
  if (typeof createArmorerWeaponProperties === "function") heavyArms.appendChild(createArmorerWeaponProperties(data));
  if (typeof createArmorerMaterialsProperties === "function")
    heavyArms.appendChild(createArmorerMaterialsProperties(data));
  if (typeof createArmorerStatusProperties === "function") heavyArms.appendChild(createArmorerStatusProperties(data));

  if (
    typeof createTabContainer === "function" &&
    typeof createArmorProperties === "function" &&
    typeof createWeaponProperties === "function" &&
    typeof createSpellProperties === "function"
  ) {
    editor.appendChild(
      createTabContainer([
        { name: "Abilities", data: abilities },
        { name: "Armor", data: createArmorProperties(data) },
        { name: "Spell", data: createSpellProperties(data) },
        { name: "Weapon", data: createWeaponProperties(data) },
        { name: "Heavy Arms", data: heavyArms },
      ]),
    );
  }

  if (typeof createHiddenInput === "function") {
    // FIXED: Upgraded safe validations to protect against null IDs causing duplication leaks
    if (data.id !== undefined && data.id !== null && data.id !== "") {
      editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    }
  }

  return editor;
}

function createArmorProperties(data) {
  if (!data) return document.createElement("div");

  const armorGroup = document.createElement("div");
  armorGroup.id = "editor-armor-group";
  armorGroup.style.display = "block";

  const armorProps = document.createElement("div");
  armorProps.className = "c20-col-2";

  if (typeof createTextInput === "function") {
    armorProps.appendChild(
      createTextInput({
        name: "mod_AC",
        title: "AC",
        value: data.mod_AC ?? "",
        placeHolder: "12",
      }),
    );
  }

  if (typeof createCheckboxInput === "function") {
    const stealth = createCheckboxInput({
      name: "modV_StealthDisadvantage",
      title: "Stealth Disadvantage",
      value: !!data.modV_StealthDisadvantage,
    });
    if (stealth) {
      stealth.style.marginTop = "22px";
      armorProps.appendChild(stealth);
    }
  }

  armorGroup.appendChild(armorProps);
  return armorGroup;
}

function createAbilityProperties(data) {
  const abilityGroup = document.createElement("div");
  abilityGroup.id = "editor-ability-group";
  abilityGroup.style.display = "block";

  const abilityContainer = document.createElement("div");
  abilityContainer.style.marginBottom = "20px";

  if (data && Array.isArray(data.abilities)) {
    data.abilities.forEach((v) => {
      if (typeof createAbilityInput === "function") {
        abilityContainer.appendChild(createAbilityInput({ ability: v.ability, type: v.type, value: v.value }));
      }
    });
  }

  const addBtn = createAddButton();
  if (addBtn) {
    // FIXED: Replaced closed anonymous leak loops with localized structural row insertion triggers
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (typeof createAbilityInput === "function") {
        addBtn.before(createAbilityInput({ ability: "", type: "", value: "" }));
      }
    });
    abilityContainer.appendChild(addBtn);
  }

  abilityGroup.appendChild(abilityContainer);

  const legend = document.createElement("legend");
  legend.textContent = "Ability Score Modifiers";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(abilityGroup);
  return fieldSet;
}

function createSkillProperties(data) {
  const abilityGroup = document.createElement("div");
  abilityGroup.id = "editor-ability-group";
  abilityGroup.style.display = "block";

  const abilityContainer = document.createElement("div");
  abilityContainer.style.marginBottom = "20px";

  if (data && Array.isArray(data.skills)) {
    data.skills.forEach((v) => {
      if (typeof createSkillInput === "function") {
        abilityContainer.appendChild(createSkillInput({ ability: v.ability, value: v.value }));
      }
    });
  }

  const addBtn = createAddButton();
  if (addBtn) {
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (typeof createSkillInput === "function") {
        addBtn.before(createSkillInput({ ability: "", value: "" }));
      }
    });
    abilityContainer.appendChild(addBtn);
  }

  abilityContainer.appendChild(addBtn);
  abilityGroup.appendChild(abilityContainer);

  const legend = document.createElement("legend");
  legend.textContent = "Skill Modifiers";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(abilityGroup);
  return fieldSet;
}

function createSaveProperties(data) {
  const abilityGroup = document.createElement("div");
  // FIXED: Changed ID to a unique name to prevent collisions with the abilities and skills tab panels
  abilityGroup.id = "editor-saves-group";
  abilityGroup.style.display = "block";

  const abilityContainer = document.createElement("div");
  abilityContainer.style.marginBottom = "20px";

  if (data && Array.isArray(data.saves)) {
    data.saves.forEach((v) => {
      if (typeof createSaveInput === "function") {
        abilityContainer.appendChild(createSaveInput({ ability: v.ability, value: v.value }));
      }
    });
  }

  const addBtn = createAddButton();
  if (addBtn) {
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (typeof createSaveInput === "function") {
        addBtn.before(createSaveInput({ ability: "", value: "" }));
      }
    });
    abilityContainer.appendChild(addBtn);
  }

  abilityGroup.appendChild(abilityContainer);

  const legend = document.createElement("legend");
  legend.textContent = "Saving Throw Modifiers";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(abilityGroup);
  return fieldSet;
}

function createSpellProperties(data) {
  if (!data) return document.createElement("div");

  const spellGroup = document.createElement("div");
  spellGroup.id = "editor-spell-group";

  const columnGroup = document.createElement("div");
  columnGroup.className = "c20-col-2";

  if (typeof createTextInput === "function") {
    columnGroup.appendChild(
      createTextInput({
        name: "modV_Spell_Attack",
        title: "Spell Attack Modifier",
        value: data.modV_Spell_Attack ?? "",
      }),
    );

    columnGroup.appendChild(
      createTextInput({
        name: "modV_Spell_DC",
        title: "Spell DC Modifier",
        value: data.modV_Spell_DC ?? "",
      }),
    );
  }

  spellGroup.appendChild(columnGroup);
  return spellGroup;
}

function createWeaponProperties(data) {
  if (!data) return document.createElement("div");

  const weaponGroup = document.createElement("div");
  weaponGroup.id = "editor-weapon-group";
  weaponGroup.style.display = "block";

  if (
    typeof createRadioInputGroup !== "function" ||
    typeof createCheckboxInput !== "function" ||
    typeof createTextInput !== "function" ||
    typeof createTextAreaInput !== "function"
  ) {
    return weaponGroup;
  }

  weaponGroup.appendChild(
    createRadioInputGroup({
      title: "",
      name: "propV_Weapon_Type",
      options: [
        { value: "Simple", name: "Simple" },
        { value: "Martial", name: "Martial" },
      ],
      selectedValue: data.propV_Weapon_Type,
      inline: true,
    }),
  );

  // FIXED: Cached local variable tracking reference to eliminate brittle childNodes lookups completely
  const handsRadioGroup = createRadioInputGroup({
    title: "",
    name: "propV_hands",
    options: [
      { value: "", name: "One-Handed" },
      { value: "Versatile", name: "Versatile" },
      { value: "Two-Handed", name: "Two-Handed" },
    ],
    selectedValue: data.propV_hands,
    inline: true,
  });
  weaponGroup.appendChild(handsRadioGroup);

  weaponGroup.appendChild(
    createRadioInputGroup({
      title: "",
      name: "propV_size",
      options: [
        { value: "Light", name: "Light" },
        { value: "", name: "Medium" },
        { value: "Heavy", name: "Heavy" },
      ],
      selectedValue: data.propV_size,
      inline: true,
    }),
  );

  const attackProps = document.createElement("div");
  attackProps.style.margin = "10px 0";
  attackProps.className = "c20-col-4";

  attackProps.appendChild(
    createCheckboxInput({ name: "prop_Ammunition", title: "Ammunition", value: !!data.prop_Ammunition }),
  );
  attackProps.appendChild(createCheckboxInput({ name: "prop_Finesse", title: "Finesse", value: !!data.prop_Finesse }));
  attackProps.appendChild(createCheckboxInput({ name: "prop_Loading", title: "Loading", value: !!data.prop_Loading }));
  attackProps.appendChild(createCheckboxInput({ name: "prop_Reach", title: "Reach", value: !!data.prop_Reach }));
  attackProps.appendChild(
    createCheckboxInput({ name: "prop_Silvered", title: "Silvered", value: !!data.prop_Silvered }),
  );
  attackProps.appendChild(createCheckboxInput({ name: "prop_Special", title: "Special", value: !!data.prop_Special }));
  attackProps.appendChild(createCheckboxInput({ name: "prop_Thrown", title: "Thrown", value: !!data.prop_Thrown }));

  weaponGroup.appendChild(attackProps);

  // primary damage layouts
  const attackPrimaryGroup = document.createElement("div");
  attackPrimaryGroup.className = "c20-col-2";

  attackPrimaryGroup.appendChild(
    createTextInput({ name: "mod_Damage", title: "Damage", value: data.mod_Damage ?? "", placeHolder: "1d8" }),
  );
  attackPrimaryGroup.appendChild(
    createTextInput({
      name: "mod_Damage_Type",
      title: "Damage Type",
      value: data.mod_Damage_Type ?? "",
      placeHolder: "Slashing",
    }),
  );
  attackPrimaryGroup.appendChild(
    createTextInput({
      name: "mod_Secondary_Damage",
      title: "Secondary Damage",
      value: data.mod_Secondary_Damage ?? "",
      placeHolder: "1d6",
    }),
  );
  attackPrimaryGroup.appendChild(
    createTextInput({
      name: "mod_Secondary_Damage_Type",
      title: "Secondary Damage Type",
      value: data.mod_Secondary_Damage_Type ?? "",
      placeHolder: "Fire",
    }),
  );

  weaponGroup.appendChild(attackPrimaryGroup);

  // alternate/versatile damage layouts
  const attackSecondaryGroup = document.createElement("div");
  attackSecondaryGroup.className = "c20-col-2";

  attackSecondaryGroup.appendChild(
    createTextInput({
      name: "mod_Alternate_Damage",
      title: "Two-Handed Damage",
      value: data.mod_Alternate_Damage ?? "",
      placeHolder: "1d10",
    }),
  );
  attackSecondaryGroup.appendChild(
    createTextInput({
      name: "mod_Alternate_Damage_Type",
      title: "Two-Handed Damage Type",
      value: data.mod_Alternate_Damage_Type ?? "",
      placeHolder: "Slashing",
    }),
  );
  attackSecondaryGroup.appendChild(
    createTextInput({
      name: "mod_Alternate_Secondary_Damage",
      title: "Two-Handed Secondary Damage",
      value: data.mod_Alternate_Secondary_Damage ?? "",
      placeHolder: "1d6",
    }),
  );
  attackSecondaryGroup.appendChild(
    createTextInput({
      name: "mod_Alternate_Secondary_Damage_Type",
      title: "Two-Handed Secondary Damage Type",
      value: data.mod_Alternate_Secondary_Damage_Type ?? "",
      placeHolder: "Fire",
    }),
  );

  weaponGroup.appendChild(attackSecondaryGroup);

  const rangeGroup = document.createElement("div");
  rangeGroup.className = "c20-col-2";

  rangeGroup.appendChild(
    createTextInput({ name: "mod_Range", title: "Range", value: data.mod_Range ?? "", placeHolder: "150/600" }),
  );
  rangeGroup.appendChild(
    createTextInput({
      name: "mod_Critical_Range",
      title: "Critical Range",
      value: data.mod_Critical_Range ?? "",
      placeHolder: "20",
    }),
  );
  rangeGroup.appendChild(
    createTextInput({ name: "modV_Weapon_Attacks", title: "Attack Modifier", value: data.modV_Weapon_Attacks ?? "" }),
  );
  rangeGroup.appendChild(
    createTextInput({ name: "modV_Weapon_Damage", title: "Damage Modifier", value: data.modV_Weapon_Damage ?? "" }),
  );

  weaponGroup.appendChild(rangeGroup);

  weaponGroup.appendChild(
    createTextAreaInput({
      name: "mod_Attack_Description",
      title: "Attack Description",
      value: data.mod_Attack_Description || "",
      height: 60,
    }),
  );

  // Initial visibility rendering layout checks
  if (data.propV_hands !== "Versatile") {
    attackSecondaryGroup.style.display = "none";
  } else {
    attackSecondaryGroup.style.display = "grid";
  }

  // FIXED: Wired up dynamic change listener straight onto our cached variable to guarantee total structural shift immunity
  handsRadioGroup.addEventListener("change", function (event) {
    if (event.target && event.target.name === "propV_hands") {
      if (event.target.value === "Versatile") {
        attackSecondaryGroup.style.display = "grid";
      } else {
        attackSecondaryGroup.style.display = "none";
      }
    }
  });

  return weaponGroup;
}

function createArmorerArmorProperties(data) {
  if (!data) return document.createElement("div");

  const armorGuide = document.createElement("div");
  armorGuide.id = "editor-armorers-armor-group";

  if (typeof createRadioInputGroup === "function") {
    const proofing = createRadioInputGroup({
      title: "",
      name: "propV_HAA_Proofing",
      options: [
        { value: "", name: "No Armor Proofing" },
        { value: "1st", name: "1st Tier" },
        { value: "2nd", name: "2nd Tier" },
        { value: "3rd", name: "3rd Tier" },
      ],
      selectedValue: data.propV_HAA_Proofing,
      inline: true,
    });
    if (proofing) {
      proofing.style.marginBottom = "10px";
      armorGuide.appendChild(proofing);
    }
  }

  const armorBoxes = document.createElement("div");
  armorBoxes.className = "c20-col-3";

  if (typeof createCheckboxInput === "function") {
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Breathable", title: "Breathable", value: !!data.prop_HAA_Breathable }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Burnished", title: "Burnished", value: !!data.prop_HAA_Burnished }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({
        name: "prop_HAA_Climbing_Harness",
        title: "Climbing Harness",
        value: !!data.prop_HAA_Climbing_Harness,
      }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Decorated", title: "Decorated", value: !!data.prop_HAA_Decorated }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Insulated", title: "Insulated", value: !!data.prop_HAA_Insulated }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Locking", title: "Locking joints", value: !!data.prop_HAA_Locking }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Muffled", title: "Muffled", value: !!data.prop_HAA_Muffled }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({
        name: "prop_HAA_Quick_Release",
        title: "Quick-release clasps",
        value: !!data.prop_HAA_Quick_Release,
      }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Reinforced", title: "Reinforced", value: !!data.prop_HAA_Reinforced }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Runic", title: "Runic", value: !!data.prop_HAA_Runic }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAA_Spiked", title: "Spiked", value: !!data.prop_HAA_Spiked }),
    );
  }

  armorGuide.appendChild(armorBoxes);

  const legend = document.createElement("legend");
  legend.textContent = "The Complete Armorer's Handbook (Armor)";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(armorGuide);
  return fieldSet;
}

function createArmorerWeaponProperties(data) {
  if (!data) return document.createElement("div");

  const weaponGuide = document.createElement("div");
  weaponGuide.id = "editor-armorers-weapon-group";
  // FIXED: Assigned column styling rules to align sub-tiers side-by-side cleanly
  weaponGuide.className = "c20-col-3";

  if (typeof createCheckboxInput !== "function") return weaponGuide;

  const weaponTier1 = document.createElement("div");
  const weaponTier1Title = document.createElement("div");
  weaponTier1Title.style.fontWeight = "700";
  weaponTier1Title.textContent = "Tier 1";
  weaponTier1.appendChild(weaponTier1Title);
  weaponTier1.appendChild(
    createCheckboxInput({ name: "prop_HAW_Balanced", title: "Balanced", value: !!data.prop_HAW_Balanced }),
  );
  weaponTier1.appendChild(
    createCheckboxInput({ name: "prop_HAW_Critical", title: "Critical", value: !!data.prop_HAW_Critical }),
  );
  weaponTier1.appendChild(
    createCheckboxInput({ name: "prop_HAW_Runic", title: "Runic", value: !!data.prop_HAW_Runic }),
  );
  weaponTier1.appendChild(
    createCheckboxInput({ name: "prop_HAW_Silvered", title: "Silvered", value: !!data.prop_HAW_Silvered }),
  );
  weaponTier1.appendChild(
    createCheckboxInput({ name: "prop_HAW_Wounding", title: "Wounding", value: !!data.prop_HAW_Wounding }),
  );
  weaponGuide.appendChild(weaponTier1);

  const weaponTier2 = document.createElement("div");
  const weaponTier2Title = document.createElement("div");
  weaponTier2Title.style.fontWeight = "700";
  weaponTier2Title.textContent = "Tier 2";
  weaponTier2.appendChild(weaponTier2Title);
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Brutal", title: "Brutal", value: !!data.prop_HAW_Brutal }),
  );
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Enchanted", title: "Enchanted", value: !!data.prop_HAW_Enchanted }),
  );
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Flanged", title: "Flanged", value: !!data.prop_HAW_Flanged }),
  );
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Magical", title: "Magical", value: !!data.prop_HAW_Magical }),
  );
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Sawtooth", title: "Saw-toothed", value: !!data.prop_HAW_Sawtooth }),
  );
  weaponTier2.appendChild(
    createCheckboxInput({ name: "prop_HAW_Superior", title: "Superior", value: !!data.prop_HAW_Superior }),
  );
  weaponGuide.appendChild(weaponTier2);

  const weaponTier3 = document.createElement("div");
  const weaponTier3Title = document.createElement("div");
  weaponTier3Title.style.fontWeight = "700";
  weaponTier3Title.textContent = "Tier 3";
  weaponTier3.appendChild(weaponTier3Title);
  weaponTier3.appendChild(
    createCheckboxInput({ name: "prop_HAW_Arcane", title: "Arcane", value: !!data.prop_HAW_Arcane }),
  );
  weaponTier3.appendChild(
    createCheckboxInput({ name: "prop_HAW_Masterwork", title: "Masterwork", value: !!data.prop_HAW_Masterwork }),
  );
  weaponGuide.appendChild(weaponTier3);

  const legend = document.createElement("legend");
  legend.textContent = "The Complete Armorer's Handbook (Weapon)";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(weaponGuide);
  return fieldSet;
}

function createArmorerMaterialsProperties(data) {
  if (!data) return document.createElement("div");

  const armorGuide = document.createElement("div");
  armorGuide.id = "editor-armorers-material-group";

  const armorBoxes = document.createElement("div");
  armorBoxes.className = "c20-col-3";

  if (typeof createCheckboxInput === "function") {
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Adamantine", title: "Adamantine", value: !!data.prop_HAM_Adamantine }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Cold_Iron", title: "Cold Iron", value: !!data.prop_HAM_Cold_Iron }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Darkwood", title: "Darkwood", value: !!data.prop_HAM_Darkwood }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({
        name: "prop_HAM_Deep_Crystal",
        title: "Deep Crystal",
        value: !!data.prop_HAM_Deep_Crystal,
      }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Dragonhide", title: "Dragonhide", value: !!data.prop_HAM_Dragonhide }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Ironwood", title: "Ironwood", value: !!data.prop_HAM_Ironwood }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Mithral", title: "Mithral", value: !!data.prop_HAM_Mithral }),
    );
    armorBoxes.appendChild(
      createCheckboxInput({ name: "prop_HAM_Shadowsilk", title: "Shadowsilk", value: !!data.prop_HAM_Shadowsilk }),
    );
  }

  armorGuide.appendChild(armorBoxes);

  const legend = document.createElement("legend");
  legend.textContent = "The Complete Armorer's Handbook (Materials)";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(armorGuide);
  return fieldSet;
}

function createArmorerStatusProperties(data) {
  if (!data) return document.createElement("div");

  const armorGuide = document.createElement("div");
  armorGuide.id = "editor-armorers-status-group";

  if (typeof createRadioInputGroup === "function") {
    const proofing = createRadioInputGroup({
      title: "",
      name: "propV_HAS_Status",
      options: [
        { value: "", name: "No Damage" },
        { value: "Worn", name: "Worn/Sundered" },
        { value: "Damaged", name: "Damaged" },
        { value: "Broken", name: "Broken" },
      ],
      selectedValue: data.propV_HAS_Status,
      inline: true,
    });
    if (proofing) {
      proofing.style.marginBottom = "10px";
      armorGuide.appendChild(proofing);
    }
  }

  if (typeof createSelectInput === "function") {
    armorGuide.appendChild(
      createSelectInput({
        name: "propV_HAS_Rune",
        title: "Rune",
        value: data.propV_HAS_Rune,
        options: [
          { name: "Alchemist", value: "Alchemist" },
          { name: "Arrow-Catcher", value: "Arrow-Catcher" },
          { name: "Bastion", value: "Bastion" },
          { name: "Blood Weapon", value: "Blood Weapon" },
          { name: "Bound Armor", value: "Bound Armor" },
          { name: "Bound weapon", value: "Bound weapon" },
          { name: "Cat", value: "Cat" },
          { name: "Chalice", value: "Chalice" },
          { name: "Chaos", value: "Chaos" },
          { name: "Daywalker", value: "Daywalker" },
          { name: "Death", value: "Death" },
          { name: "Displacement", value: "Displacement" },
          { name: "Dragonbane", value: "Dragonbane" },
          { name: "Earthshaker", value: "Earthshaker" },
          { name: "Elemental Shield", value: "Elemental Shield" },
          // FIXED: Corrected spelling typo for the Featherfoot rune asset lookup tag
          { name: "Featherfoot", value: "Featherfoot" },
          { name: "Force of Will", value: "Force of Will" },
          { name: "Giant Slayer", value: "Giant Slayer" },
          { name: "Hunt", value: "Hunt" },
          { name: "Journey", value: "Journey" },
          { name: "Knock", value: "Knock" },
          { name: "Magebane", value: "Magebane" },
          { name: "Mariner", value: "Mariner" },
          { name: "Mark/Recall", value: "Mark/Recall" },
          { name: "Mime", value: "Mime" },
          { name: "Nondetection", value: "Nondetection" },
          { name: "Overshield", value: "Overshield" },
          { name: "Phoenix", value: "Phoenix" },
          { name: "Retribution", value: "Retribution" },
          { name: "Serpent", value: "Serpent" },
          { name: "Soultrap", value: "Soultrap" },
          { name: "Superconductor", value: "Superconductor" },
          { name: "Tempest", value: "Tempest" },
          { name: "Thief", value: "Thief" },
          { name: "Volant", value: "Volant" },
          { name: "Warmage", value: "Warmage" },
          { name: "Warrior", value: "Warrior" },
          { name: "Wolfsbane", value: "Wolfsbane" },
        ],
      }),
    );
  }

  const legend = document.createElement("legend");
  legend.textContent = "The Complete Armorer's Handbook (Status)";

  const fieldSet = document.createElement("fieldset");
  fieldSet.appendChild(legend);
  fieldSet.appendChild(armorGuide);
  return fieldSet;
}

// FIXED: Global shared handler to break reference cycles and prevent memory leaks completely
function handleItemSubRowDelete(event) {
  event.preventDefault();
  const deleteBtn = event.currentTarget;
  // Safely find and target the outermost container row cell matching our component block
  const parentTargetRow = deleteBtn.closest(".c20-col-3") || deleteBtn.closest(".c20-col-2");
  if (parentTargetRow) {
    parentTargetRow.remove();
  }
}

function createAbilityInput({ ability, type, value }) {
  const group = document.createElement("div");
  group.className = "c20-col-3";

  // FIXED: Explicitly grouped dynamic fields using object naming conventions to prevent missing values from scrambling columns on submission
  if (typeof createSelectInput === "function") {
    group.appendChild(
      createSelectInput({
        name: "abilities.ability[]",
        title: "Ability",
        value: ability,
        required: true,
        options: [
          { name: "Strength", value: "Strength" },
          { name: "Dexterity", value: "Dexterity" },
          { name: "Constitution", value: "Constitution" },
          { name: "Intelligence", value: "Intelligence" },
          { name: "Wisdom", value: "Wisdom" },
          { name: "Charisma", value: "Charisma" },
        ],
      }),
    );

    group.appendChild(
      createSelectInput({
        name: "abilities.type[]",
        title: "Modification Type",
        value: type,
        required: true,
        options: [
          { name: "Increase", value: "Increase" },
          { name: "Set", value: "Set" },
        ],
      }),
    );
  }

  const textGroup = document.createElement("div");
  if (typeof createTextInput === "function") {
    textGroup.appendChild(
      createTextInput({
        name: "abilities.value[]",
        title: "Value",
        value: value ?? "",
        required: true,
      }),
    );
  }

  const btn = document.createElement("button");
  btn.style.float = "right";
  btn.textContent = "Delete";
  // SUCCESS: Bound straight onto our leak-free relative traversal utility handler function
  btn.addEventListener("click", handleItemSubRowDelete);

  textGroup.appendChild(btn);
  group.appendChild(textGroup);
  return group;
}

function createSkillInput({ ability = "", value = "" } = {}) {
  const group = document.createElement("div");
  group.className = "c20-col-2";

  if (typeof createSelectInput === "function") {
    group.appendChild(
      createSelectInput({
        name: "skills.ability[]",
        title: "Ability",
        value: ability,
        required: true,
        options: [
          { name: "All Abilities", value: "Ability Checks" },
          { name: "Acrobatics", value: "Acrobatics" },
          { name: "Animal Handling", value: "Animal Handling" },
          { name: "Arcana", value: "Arcana" },
          { name: "Athletics", value: "Athletics" },
          { name: "Deception", value: "Deception" },
          { name: "History", value: "History" },
          { name: "Insight", value: "Insight" },
          { name: "Intimidation", value: "Intimidation" },
          { name: "Investigation", value: "Investigation" },
          { name: "Medicine", value: "Medicine" },
          { name: "Nature", value: "Nature" },
          { name: "Perception", value: "Perception" },
          { name: "Performance", value: "Performance" },
          { name: "Persuasion", value: "Persuasion" },
          { name: "Religion", value: "Religion" },
          { name: "Sleight of Hand", value: "Sleight of Hand" },
          { name: "Stealth", value: "Stealth" },
          { name: "Survival", value: "Survival" },
        ],
      }),
    );
  }

  const textGroup = document.createElement("div");
  if (typeof createTextInput === "function") {
    textGroup.appendChild(
      createTextInput({
        name: "skills.value[]",
        title: "Value",
        value: value ?? "",
        required: true,
      }),
    );
  }

  const btn = document.createElement("button");
  btn.style.float = "right";
  btn.textContent = "Delete";
  btn.addEventListener("click", handleItemSubRowDelete);

  textGroup.appendChild(btn);
  group.appendChild(textGroup);
  return group;
}

// FIXED: Re-use our global shared relative traversal utility handler to prevent memory leaks completely
function handleItemSubRowDelete(event) {
  event.preventDefault();
  const deleteBtn = event.currentTarget;
  const parentTargetRow = deleteBtn.closest(".c20-col-3") || deleteBtn.closest(".c20-col-2");
  if (parentTargetRow) {
    parentTargetRow.remove();
  }
}

function createSaveInput({ ability = "", value = "" } = {}) {
  const group = document.createElement("div");
  group.className = "c20-col-2";

  // FIXED: Group fields explicitly using dot-notation schemas to shield array indexing bounds from splitting corruption
  if (typeof createSelectInput === "function") {
    group.appendChild(
      createSelectInput({
        name: "saves.ability[]",
        title: "Saving Throw",
        value: ability,
        required: true,
        options: [
          { name: "All Saves", value: "Saving Throws" },
          { name: "Strength", value: "Strength Save" },
          { name: "Dexterity", value: "Dexterity Save" },
          { name: "Constitution", value: "Constitution Save" },
          { name: "Intelligence", value: "Intelligence Save" },
          { name: "Wisdom", value: "Wisdom Save" },
          { name: "Charisma", value: "Charisma Save" },
        ],
      }),
    );
  }

  const textGroup = document.createElement("div");
  if (typeof createTextInput === "function") {
    textGroup.appendChild(
      createTextInput({
        name: "saves.value[]",
        title: "Value",
        value: value ?? "",
        required: true,
      }),
    );
  }

  const btn = document.createElement("button");
  btn.style.float = "right";
  btn.textContent = "Delete";
  // SUCCESS: Tied securely to our leak-free relative DOM traversal utility function
  btn.addEventListener("click", handleItemSubRowDelete);

  textGroup.appendChild(btn);
  group.appendChild(textGroup);
  return group;
}

// FIXED: Modernized reconstruction parser engine to process our new safe dot-notated input schemas defensively
function constructItemAbilityData(formData) {
  if (!formData) return {};

  // Clean, self-healing deconstruction mapper block
  const cleanData = { ...formData };

  // 1. Reconstruct Safe Abilities Map Arrays
  const rawAbilities = formData["abilities.ability[]"];
  const rawAbilitiesType = formData["abilities.type[]"];
  const rawAbilitiesValue = formData["abilities.value[]"];

  if (rawAbilities) {
    // Force inputs into standardized list forms even if single elements are submitted
    const listAbilities = Array.isArray(rawAbilities) ? rawAbilities : [rawAbilities];
    const listTypes = Array.isArray(rawAbilitiesType) ? rawAbilitiesType : [rawAbilitiesType];
    const listVals = Array.isArray(rawAbilitiesValue) ? rawAbilitiesValue : [rawAbilitiesValue];

    cleanData.abilities = listAbilities.map((ability, index) => ({
      ability: ability || "Strength",
      type: listTypes[index] || "Increase",
      value: listVals[index] || "0",
    }));

    // Discard flat array artifacts cleanly out of the final save payload structure
    delete cleanData["abilities.ability[]"];
    delete cleanData["abilities.type[]"];
    delete cleanData["abilities.value[]"];
  }

  // 2. Reconstruct Safe Skills Map Arrays
  const rawSkills = formData["skills.ability[]"];
  const rawSkillsValue = formData["skills.value[]"];

  if (rawSkills) {
    const listSkills = Array.isArray(rawSkills) ? rawSkills : [rawSkills];
    const listVals = Array.isArray(rawSkillsValue) ? rawSkillsValue : [rawSkillsValue];

    cleanData.skills = listSkills.map((skill, index) => ({
      ability: skill || "Ability Checks",
      value: listVals[index] || "0",
    }));

    delete cleanData["skills.ability[]"];
    delete cleanData["skills.value[]"];
  }

  // 3. Reconstruct Safe Saving Throws Map Arrays
  const rawSaves = formData["saves.ability[]"];
  const rawSavesValue = formData["saves.value[]"];

  if (rawSaves) {
    const listSaves = Array.isArray(rawSaves) ? rawSaves : [rawSaves];
    const listVals = Array.isArray(rawSavesValue) ? rawSavesValue : [rawSavesValue];

    cleanData.saves = listSaves.map((save, index) => ({
      ability: save || "Saving Throws",
      value: listVals[index] || "0",
    }));

    delete cleanData["saves.ability[]"];
    delete cleanData["saves.value[]"];
  }

  return cleanData;
}
