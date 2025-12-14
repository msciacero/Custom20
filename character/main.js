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

async function init() {
  window.campaign_id = window.location.href.split("/")[5];
  window.character_id = window.location.href.split("/")[6];
  await StorageHelper.initCharacter();

  Defenses.init();
  Conditions.init();
  MiniNotes.init();
  Spells.init();
  CompendiumImport.init();
}

waitForElement(".sheetform").then(() => {
  init();
});
