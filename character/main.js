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

function init() {
  window.character_id = window.location.href.split("/")[6];
  Defenses.init();
  Conditions.init();
  MiniNotes.init();

  chrome.storage.onChanged.addListener(function (changes, _) {
    if (Object.keys(changes).includes("global-conditions")) {
      Conditions.reset();
    }
  });
}

waitForElement(".sheetform").then(() => {
  init();
});
