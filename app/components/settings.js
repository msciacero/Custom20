var Settings = (function () {
  var storageKey = "global-settings";

  var settings = {
    journal: true,
  };

  // settings ui
  function createInterface() {
    var panel = getSettingsPanel();
    var panelBody = panel.querySelector(".panel-body div");
    var journalCheckBox = getSettingsCheckbox({ value: "Enable Journal", isChecked: settings.journal });

    panelBody.appendChild(journalCheckBox);
    panelBody.appendChild(getSettingsModalLink({ value: "Edit Conditions", event: ConditionsEditor.show }));
    panelBody.appendChild(getSettingsModalLink({ value: "Reset Data", event: DataReset.show }));
    document.querySelector("#settings-accordion").appendChild(panel);

    journalCheckBox.querySelector("input").addEventListener("click", function (event) {
      settings.journal = !settings.journal;
      journalCheckBox.classList.toggle("is-checked");
      journalCheckBox.children[0].classList.toggle("is-checked");
      if (settings.journal) Journal.init();
      else Journal.remove();
      saveSettings();
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
    input.value = data.isChecked;

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

  function getSettingsModalLink(data) {
    var div = document.createElement("div");
    div.style.marginTop = "10px";

    var btn = document.createElement("a");
    btn.textContent = data.value;
    btn.href = "#";

    btn.addEventListener("click", data.event);

    div.appendChild(btn);
    return div;
  }

  //save
  function saveSettings() {
    chrome.storage.local.set({ [storageKey]: JSON.stringify(settings) });
  }

  //load
  async function loadSettings() {
    var storedData = await chrome.storage.local.get([storageKey]);
    if (storedData[storageKey] === undefined) return;

    settings = JSON.parse(storedData[storageKey]);
  }

  var Settings = {
    init: async function init() {
      await loadSettings();
      createInterface();
    },
    isEnabled: function isEnabled(key) {
      return settings[key];
    },
  };

  return Settings;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Settings;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Settings;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Settings", []).factory("Settings", function () {
    return Settings;
  });
}
