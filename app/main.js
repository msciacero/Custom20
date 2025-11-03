//--Adds C20 settings to Roll20 Settings UI--
//enable/disable journal enhancements
//delete stored data for this campaign/all campaigns

var storageId = "settings";

var settings = {
  journal: true,
};

// settings ui
function createInterface() {
  var panel = getSettingsPanel();
  var panelBody = panel.querySelector(".panel-body div");
  var journalCheckBox = getSettingsCheckbox({ value: "Enable Journal", isChecked: settings.journal });

  panelBody.appendChild(journalCheckBox);
  document.querySelector("#settings-accordion").appendChild(panel);

  journalCheckBox.querySelector("input").addEventListener("click", function (event) {
    settings.journal = !settings.journal;
    journalCheckBox.classList.toggle("is-checked");
    journalCheckBox.children[0].classList.toggle("is-checked");

    if (settings.journal) Journal.init();
  });
}

function getSettingsCheckbox(data) {
  var label = document.createElement("label");
  label.className = "el-checkbox";
  label.style = "margin-bottom: 0px; white-space: break-spaces;";
  if (data.isChecked) label.classList.add("is-checked");

  var span = document.createElement("span");
  span.className = "el-checkbox__input";
  if (data.isChecked) span.classList.add("is-checked");

  var input = document.createElement("input");
  input.className = "el-checkbox__original";
  input.type = "checkbox";
  input.value = data.value;

  var inputSpan = document.createElement("span");
  inputSpan.className = "el-checkbox__inner";

  var spanLabel = document.createElement("span");
  spanLabel.className = "el-checkbox__label";
  spanLabel.textContent = data.value;

  span.appendChild(input);
  span.appendChild(inputSpan);
  label.appendChild(span);
  label.appendChild(spanLabel);

  return label;
}

function getSettingsPanel() {
  const panelHtml = `
    <div data-v-c20settings="" class="panel panel-default">
        <div data-v-c20settings="" id="panel_heading_personalization" class="panel-heading collapsed" data-toggle="collapse" data-parent="#settings-accordion" href="#c20-settings" aria-expanded="false">
            <h4 data-v-c20settings="" class="panel-title">
                <a data-v-c20settings="" class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#settings-accordion" href="#c20-settings" aria-expanded="false">C20 Settings</a>
            </h4>
        </div>
        <div data-v-c20settings="" id="c20-settings" class="panel-collapse collapse" aria-expanded="false" style="height: 0px;">
            <div data-v-c20settings="" class="panel-body">
                <div data-v-c20settings="">
                </div>
            </div>
        </div>
    </div>`;

  const parser = new DOMParser();
  const panel = parser.parseFromString(panelHtml, "text/html");

  return panel.querySelector(".panel");
}

//save
function saveSettings() {
  chrome.storage.local.set({ storageId: LZString.compressToUTF16(JSON.stringify(settings)) });
}

//load
async function loadSettings() {
  var storedData = await chrome.storage.local.get([storageId]);
  if (storedData[storageId] === undefined) return;

  settings = JSON.parse(LZString.decompressFromUTF16(storedData[storageId]));
}

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
      if (total > 300) {
        majorError = true;
        clearInterval(interval);
        throw "C20 rolled a natural 1: Children timeout";
      }
      total = total + 1;
    }, 100);
  });
}

function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement("script");
  s.setAttribute("type", "text/javascript");
  s.setAttribute("src", file);
  th.appendChild(s);
}

function init() {
  if (document.querySelector("#c20-settings")) return;
  window.campaign_id = document.querySelector("#c20-campaignInfo").getAttribute("c20-campaign-id");

  waitForChildren("#textchat .content").then(async () => {
    await loadSettings();
    createInterface();

    if (settings.journal) Journal.init();
  });
}

// Usage
waitForElement("#settings-accordion").then(() => {
  injectScript(chrome.runtime.getURL("app/campaigninfo.js"), "body");
  waitForElement("#c20-campaignInfo").then(() => {
    init();
  });
});
