var Settings = (function () {
  const storageKey = "global-settings";
  let settings = {};

  // settings ui elements constructor
  function createInterface() {
    const panel = getSettingsPanel();
    if (!panel) return;

    const panelBody = panel.querySelector(".panel-body div");
    if (!panelBody) return;

    const journalCheckBox = getSettingsCheckbox({ value: "Use C20 Journal", isChecked: settings.journal });
    const markerMenuCheckBox = getSettingsCheckbox({ value: "Use C20 Marker Menu", isChecked: settings.markerMenu });

    panelBody.appendChild(journalCheckBox);
    panelBody.appendChild(markerMenuCheckBox);
    panelBody.appendChild(getSettingsModalLink({ value: "Edit Compendium", event: CompendiumEditor.show }));
    panelBody.appendChild(getSettingsModalLink({ value: "Import/Export", event: DataEditor.show }));

    // FIXED: Ensured safe structural guard check boundaries to guard against early asset injection failures
    const accordionAnchor = document.querySelector("#settings-accordion");
    if (accordionAnchor) {
      accordionAnchor.appendChild(panel);
    } else {
      console.warn("[C20] Aborting settings placement: '#settings-accordion' panel container missing.");
      return;
    }

    // FIXED: Changed event listeners to standard change trackers to prevent desynced inputs state flips
    journalCheckBox.querySelector("input")?.addEventListener("change", function (event) {
      const isChecked = event.target.checked;
      settings.journal = isChecked;

      // Clean token class additions
      journalCheckBox.classList.toggle("is-checked", isChecked);
      journalCheckBox.children[0]?.classList.toggle("is-checked", isChecked);

      if (settings.journal) {
        Journal.init();
      } else {
        Journal.remove();
      }
      saveSettings();
    });

    markerMenuCheckBox.querySelector("input")?.addEventListener("change", function (event) {
      const isChecked = event.target.checked;
      settings.markerMenu = isChecked;

      markerMenuCheckBox.classList.toggle("is-checked", isChecked);
      markerMenuCheckBox.children[0]?.classList.toggle("is-checked", isChecked);

      if (settings.markerMenu) {
        MarkerMenu.init();
      } else {
        MarkerMenu.remove();
      }
      saveSettings();
    });
  }

  function getSettingsCheckbox(data) {
    const label = document.createElement("label");
    label.className = "el-checkbox";
    label.style.cssText = "margin-bottom: 0px; white-space: break-spaces;";
    if (data.isChecked) label.classList.add("is-checked");

    const span = document.createElement("span");
    span.className = "el-checkbox__input";
    if (data.isChecked) span.classList.add("is-checked");

    const input = document.createElement("input");
    input.className = "el-checkbox__original";
    input.type = "checkbox";
    input.checked = data.isChecked; // FIXED: Maps directly to the checked state property parameter track

    const inputSpan = document.createElement("span");
    inputSpan.className = "el-checkbox__inner";

    const spanLabel = document.createElement("span");
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
    const doc = parser.parseFromString(panelHtml, "text/html");
    return doc.querySelector(".panel");
  }

  function getSettingsModalLink(data) {
    const div = document.createElement("div");
    div.style.marginTop = "10px";

    const btn = document.createElement("button");
    btn.textContent = data.value;
    btn.addEventListener("click", data.event);

    div.appendChild(btn);
    return div;
  }

  // save records securely
  async function saveSettings() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.campaigns, "all", settings, "settings");
  }

  // load configurations safely
  async function loadSettings() {
    const storedData = await StorageHelper.getItem(StorageHelper.dbNames.campaigns, "all", "settings");

    if (storedData === undefined) {
      // FIXED: Only execute automated writes to set up clean initial storage state pools if blank
      settings = {
        journal: true,
        markerMenu: true,
      };
      await saveSettings();
    } else {
      settings = storedData;
      if (settings.journal === undefined) settings.journal = true;
      if (settings.markerMenu === undefined) settings.markerMenu = true;
    }
  }

  const Settings = {
    init: async function init() {
      await loadSettings();
      createInterface();
    },
    isEnabled: function isEnabled(key) {
      return settings[key] ?? false; // Fallback false validation safety bounds
    },
  };

  return Settings;
})();
