var Attacks = (function () {
  function processInput(event) {
    if (event.target.name === "attr_dmgmod") {
      updateDamageModifier(event);
    } else if (event.target.name === "attr_atk_desc") {
      updateAttackDescription(event);
    }
  }

  function updateAttackDescription(event) {
    const roll20Item = getInventoryItem(event);
    if (!roll20Item) return;

    const itemMods = getItemModifiers(roll20Item);
    const inputValue = event.target.value?.trim() || "";
    let found = false;

    for (let i = 0; i < itemMods.length; i++) {
      if (itemMods[i].startsWith("Attack Description")) {
        if (inputValue) {
          itemMods[i] = "Attack Description: " + inputValue;
        } else {
          itemMods.splice(i, 1);
        }
        found = true;
        break;
      }
    }

    if (!found && inputValue) {
      itemMods.push("Attack Description: " + inputValue);
    }

    updateItemModifiers(roll20Item, itemMods);
  }

  function updateDamageModifier(event) {
    const roll20Item = getInventoryItem(event);
    if (!roll20Item) return;

    // Optional chaining to prevent early-load structural crashes
    const optionsParent = event.target.closest(".options");
    const magicmod = optionsParent?.querySelector("input[name='attr_atkmagic']")?.value || "";
    if (magicmod) return;

    const itemMods = getItemModifiers(roll20Item);
    const attackTypeRegex = /(?:^|,)\s*Item Type: (Melee|Ranged) Weapon(?:,|$)/i;
    const attackTypeResults = attackTypeRegex.exec(itemMods.join(","));
    const atktype = attackTypeResults ? attackTypeResults[1] : "Weapon";
    const numericValue = Number(event.target.value) || 0;

    let damagemod_found = false;
    for (let i = 0; i < itemMods.length; i++) {
      if (itemMods[i].match(/^(Weapon|Melee|Ranged) Damage[:]?\s([+-]?\d+)$/)) {
        damagemod_found = true;

        if (numericValue !== 0) {
          itemMods[i] = `${atktype} Damage +${numericValue}`;
        } else {
          itemMods.splice(i, 1);
        }
        break;
      }
    }

    if (!damagemod_found && numericValue !== 0) {
      itemMods.push(`${atktype} Damage +${numericValue}`);
    }

    // Debounced loop boundary execution placeholder layout frame
    setTimeout(() => {
      updateItemModifiers(roll20Item, itemMods);
    }, 1000);
  }

  function getInventoryItem(event) {
    const parentRow = event.target.closest(".repitem");
    const itemId = parentRow?.querySelector('input[name="attr_spellid"], input[name="attr_itemid"]')?.value;
    if (!itemId) return null;

    return document.querySelector(`.page .equipment .complex .repitem[data-reprowid="${itemId}" i]`);
  }

  function getItemModifiers(roll20Item) {
    const modifiersInput = roll20Item.querySelector("input[name='attr_itemmodifiers']");
    const itemMods = modifiersInput?.value || "";
    return itemMods ? itemMods.split(",") : [];
  }

  function updateItemModifiers(roll20Item, itemMods) {
    const input = roll20Item.querySelector("input[name='attr_itemmodifiers']");
    if (!input) return;

    const consolidatedMods = itemMods.join(",");
    if (input.value !== consolidatedMods) {
      input.value = consolidatedMods;
      // Trigger native Roll20 synchronization engine updates safely
      input.dispatchEvent(new Event("blur"));
    }
  }

  const Attacks = {
    init: function init() {
      const repContainer = document.querySelector(".page .attacks .repcontainer");
      if (repContainer) {
        repContainer.addEventListener("change", processInput);
      } else {
        console.warn("[C20] Could not attach listener: '.page .attacks .repcontainer' anchor node missing.");
      }

      // Initialize existing damage modifier values safely
      document.querySelectorAll(".page .attacks .repcontainer input[name='attr_dmgmod']").forEach((x) => {
        if (x.value && Number(x.value) !== 0) updateDamageModifier({ target: x });
      });

      document.querySelectorAll(".page .attacks .repcontainer textarea[name='attr_atk_desc']").forEach((x) => {
        if (x.value) updateAttackDescription({ target: x });
      });
    },
  };

  return Attacks;
})();
