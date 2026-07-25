function levelEvent() {
  const targetNode = document.querySelector(".charactersheet > input[name='attr_level']");
  if (!targetNode) return;

  const observer = new MutationObserver(async (mutationsList) => {
    if (CharacterSettings.settings.spellView) {
      observer.disconnect();

      const spellRows = document.querySelectorAll(".spell-container .repcontainer .spell");
      for (const s of spellRows) {
        await Spells.updateSpellRow(s);
      }

      observer.observe(targetNode, { attributes: true });
    }
  });

  observer.observe(targetNode, { attributes: true });
}

async function init5e() {
  const urlParts = window.location.href.split("/");
  window.campaign_id = urlParts[5] || null;
  window.character_id = urlParts[6] || null;

  if (!window.character_id) {
    console.error("Aborting character sheet setup: No valid character ID found in URL.");
    return;
  }

  await StorageHelper.initCharacter();
  await CharacterSettings.init();

  if (CharacterSettings.settings.defenses) await Defenses.init();
  if (CharacterSettings.settings.conditionCompendium !== "off") await Conditions.init();
  if (CharacterSettings.settings.spellFilter) await Spells.initFilter();
  if (CharacterSettings.settings.spellView) await Spells.initUi();
  if (CharacterSettings.settings.traitsView) Traits.init();
  CompendiumImport.init();
  if (CharacterSettings.settings.itemView) Inventory.init();
  Attacks.init();
  Characteristics.init();
  levelEvent();
}

var dnd2014Image = [
  'url("https://app.roll20.net/images/dndstyling/CharScroll.svg")',
  'url("https://storage.googleapis.com/char-sheet-app-images-6e101411/D%26D5e/images/darkmode/CharScroll_dm.svg")',
];

waitForElement(".sheetform").then(() => {
  const headerElement = document.querySelector(".container.pc .header");
  if (!headerElement) return;

  const currentBg = window.getComputedStyle(headerElement)?.backgroundImage;
  if (dnd2014Image.includes(currentBg)) {
    init5e().catch((err) => console.error("Character boot layout failure:", err));
  }
});
