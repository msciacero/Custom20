function createSpellEditor(data) {
  if (!data) return document.createElement("form");

  const editor = document.createElement("form");
  editor.className = "c20-form";
  editor.style.cssText = "margin: 20px 0 30px 0;";

  // Core Fields Group
  editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name || "", required: true }));

  editor.appendChild(
    createSelectInput({
      name: "level",
      title: "Level",
      value: data.level,
      required: true,
      options: [
        { name: "Cantrip", value: "cantrip" },
        { name: "1st", value: "1" },
        { name: "2nd", value: "2" },
        { name: "3rd", value: "3" },
        { name: "4th", value: "4" },
        { name: "5th", value: "5" },
        { name: "6th", value: "6" },
        { name: "7th", value: "7" },
        { name: "8th", value: "8" },
        { name: "9th", value: "9" },
      ],
    }),
  );

  editor.appendChild(
    createSelectInput({
      name: "school",
      title: "School",
      value: data.school,
      required: true,
      options: [
        { name: "Abjuration", value: "abjuration" },
        { name: "Conjuration", value: "conjuration" },
        { name: "Divination", value: "divination" },
        { name: "Enchantment", value: "enchantment" },
        { name: "Evocation", value: "evocation" },
        { name: "Illusion", value: "illusion" },
        { name: "Necromancy", value: "necromancy" },
        { name: "Transmutation", value: "transmutation" },
      ],
    }),
  );

  editor.appendChild(createTextInput({ name: "time", title: "Casting Time", value: data.time || "", required: true }));
  editor.appendChild(createTextInput({ name: "range", title: "Range/Area", value: data.range || "", required: false }));
  editor.appendChild(
    createTextInput({ name: "duration", title: "Duration", value: data.duration || "", required: false }),
  );

  // FIXED: Cached local references to variables instead of brittle childNodes query maps
  const savingThrowSelectRow = createSelectInput({
    name: "savingThrow",
    title: "Saving Throw",
    value: data.savingThrow ?? "",
    required: false,
    options: [
      { name: "Strength", value: "Strength" },
      { name: "Dexterity", value: "Dexterity" },
      { name: "Constitution", value: "Constitution" },
      { name: "Intelligence", value: "Intelligence" },
      { name: "Wisdom", value: "Wisdom" },
      { name: "Charisma", value: "Charisma" },
    ],
  });
  editor.appendChild(savingThrowSelectRow);

  const savingEffectInputRow = createTextInput({
    name: "savingEffect",
    title: "Saving Effect",
    value: data.savingEffect || "",
    required: false,
  });
  editor.appendChild(savingEffectInputRow);

  editor.appendChild(
    createCheckboxInput({ name: "concentration", title: "Concentration", value: !!data.concentration }),
  );
  editor.appendChild(createCheckboxInput({ name: "ritual", title: "Ritual", value: !!data.ritual }));
  editor.appendChild(createCheckboxInput({ name: "verbal", title: "Verbal", value: !!data.verbal }));
  editor.appendChild(createCheckboxInput({ name: "somatic", title: "Somatic", value: !!data.somatic }));

  const materialCheckboxRow = createCheckboxInput({ name: "material", title: "Material", value: !!data.material });
  editor.appendChild(materialCheckboxRow);

  const materialsTextInputRow = createTextInput({
    name: "materials",
    title: "Materials",
    value: data.materials || "",
    required: false,
  });
  editor.appendChild(materialsTextInputRow);

  editor.appendChild(
    createSelectInput({
      name: "attack",
      title: "Attack",
      value: data.attack || "None",
      required: true,
      options: [
        { name: "None", value: "None" },
        { name: "Melee", value: "Melee" },
        { name: "Ranged", value: "Ranged" },
      ],
    }),
  );

  editor.appendChild(
    createTextInput({ name: "healing", title: "Healing", value: data.healing || "", required: false }),
  );
  editor.appendChild(
    createTextInput({ name: "damageRoll", title: "Damage", value: data.damageRoll || "", required: false }),
  );
  editor.appendChild(
    createTextInput({ name: "damageType", title: "Damage Type/Effect", value: data.damageType || "", required: false }),
  );

  const abilityModifierRow = createCheckboxInput({
    name: "abilityModifier",
    title: "Add Ability Modifier to Damage/Healing",
    value: !!data.abilityModifier,
  });
  editor.appendChild(abilityModifierRow);

  editor.appendChild(
    createTextAreaInput({ name: "description", title: "Description", value: data.description || "", required: false }),
  );
  editor.appendChild(
    createTextAreaInput({
      name: "higherLevels",
      title: "At Higher Levels",
      value: data.higherLevels || "",
      required: false,
    }),
  );
  editor.appendChild(
    createTextInput({ name: "higherRoll", title: "Higher Level Roll", value: data.higherRoll || "", required: false }),
  );
  editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source || "", required: false }));

  if (typeof createHiddenInput === "function") {
    editor.appendChild(createHiddenInput({ name: "type", value: data.type || "spell" }));
    if (data.id !== undefined && data.id !== null && data.id !== "") {
      editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    }
  }

  // FIXED: Safer style positioning selectors mapping explicitly via object tracking references
  if (abilityModifierRow) {
    abilityModifierRow.style.marginBottom = "10px";
  }

  // Extract target inner raw inputs using safe localized queries inside row blocks
  const innerSavingThrowSelect = savingThrowSelectRow.querySelector("select");
  const innerSavingEffectInput = savingEffectInputRow.querySelector("input");
  const innerMaterialCheckbox = materialCheckboxRow.querySelector("input");
  const innerMaterialsTextInput = materialsTextInputRow.querySelector("input");

  // Initial conditional validation locks configuration setup
  if (innerSavingEffectInput) {
    innerSavingEffectInput.disabled = data.savingThrow === "" || !data.savingThrow;
  }
  if (innerMaterialsTextInput) {
    innerMaterialsTextInput.disabled = !data.material;
  }

  // FIXED: Wired up event listeners to cached nodes dynamically to ensure total structural shift immunity
  if (innerSavingThrowSelect && innerSavingEffectInput) {
    innerSavingThrowSelect.addEventListener("change", function (event) {
      innerSavingEffectInput.disabled = event.target.value === "";
    });
  }

  if (innerMaterialCheckbox && innerMaterialsTextInput) {
    innerMaterialCheckbox.addEventListener("change", function (event) {
      innerMaterialsTextInput.disabled = !event.target.checked;
    });
  }

  return editor;
}
