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
      if (total > 120) {
        clearInterval(interval);
        throw "C20 rolled a natural 1: Page timeout";
      }
      total = total + 1;
    }, 500);
  });
}

function waitForChildren(selector) {
  return new Promise((resolve) => {
    var total = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element?.childElementCount && element.childElementCount > 0) {
        clearInterval(interval);
        resolve(element);
      }
      //Something is wrong, eject to prevent performance issues
      if (total > 120) {
        clearInterval(interval);
        throw "C20 rolled a natural 1: Children timeout";
      }
      total = total + 1;
    }, 500);
  });
}

function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  th.appendChild(s);
}

// Usage
waitForElement("#settings-accordion").then(() => {
  injectScript(chrome.runtime.getURL("app/components/shared/campaignInfo.js"), "body");
  waitForElement("#c20-campaignInfo").then(() => {
    window.campaign_id = document.querySelector("#c20-campaignInfo").getAttribute("c20-campaign-id");

    Data.initConditions();
    Settings.init();
    Journal.init();
  });
});
