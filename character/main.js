// initialization
function waitForElement(selector) {
  return new Promise((resolve) => {
    var total = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
      //Something is wrong, eject to prevent performance issues
      if (total > 300) {
        majorError = true;
        clearInterval(interval);
        throw "C20 rolled a natural 1: Page timeout";
      }
      total = total + 1;
    }, 100);
  });
}

function levelEvent() {
  var observer = new MutationObserver(async (mutationsList, _) => {
    var settings = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "settings");
    if (settings.spellView) {
      document.querySelectorAll(".spell-container .repcontainer .spell").forEach((s) => Spells.updateSpellRow(s));
    }
  });

  const targetNode = document.querySelector(".charactersheet > input[name='attr_level']"); // Or any other DOM element
  const config = {
    attributes: true, // Observe additions/removals of child nodes
  };

  observer.observe(targetNode, config);
}

async function init() {
  window.campaign_id = window.location.href.split("/")[5];
  window.character_id = window.location.href.split("/")[6];

  await StorageHelper.initCharacter();
  await CharacterSettings.init();

  var settings = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "settings");

  if (settings.defenses) Defenses.init();
  if (settings.conditionCompendium !== "off") Conditions.init();
  if (settings.spellFilter) Spells.initFilter();
  if (settings.spellView) Spells.initUi();
  MiniNotes.init();
  CompendiumImport.init();
  levelEvent();
}

waitForElement(".sheetform").then(() => {
  init();
});
