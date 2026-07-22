function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  th.appendChild(s);
}

// Usage
waitForElement("#settings-accordion").then(() => {
  injectScript(browser.runtime.getURL("library/data/campaignInfo.js"), "body");
  waitForElement("#c20-campaignInfo").then(async () => {
    window.campaign_id = document.querySelector("#c20-campaignInfo").getAttribute("c20-campaign-id");
    await StorageHelper.initCompendium();
    await StorageHelper.initCampaign();
    await Settings.init();
    await Compendium.init();
    if (Settings.isEnabled("journal")) Journal.init();
    if (Settings.isEnabled("markerMenu")) MarkerMenu.init();
  });
});
