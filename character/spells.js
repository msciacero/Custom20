//TODO
//Save DC option??
//Save/Load

var Spells = (function () {
  var storageKey = "";
  var defaultFilter = JSON.stringify({
    concentration: true,
    material: true,
    prepared: false,
    ritual: false,
    somatic: true,
    verbal: true,
  });

  var spellData = {
    filter: {
      concentration: true,
      material: true,
      prepared: false,
      ritual: false,
      somatic: true,
      verbal: true,
    },
    additionalInfo: [],
  };

  function createUi() {
    var page = document.querySelector(".page.spells");
    page.classList.add("c20-v2");

    createSpellFilter();

    document.querySelectorAll(".spell-container").forEach((s, i) => createSpellHeader(s, i));
    document.querySelectorAll(".spell-container .spell > .display > button").forEach((s) => createSpellRow(s));

    document
      .querySelectorAll(".spell-container .spell .options .row:has(input[name='attr_spelltarget']")
      .forEach((s) => {
        s.after(createSpellOption({ text: "HIT/SAVE DC:", attr: "attr_spelldc" }));
      });

    document
      .querySelectorAll(".spell-container .spell .details .row:has(span[name='attr_spelltarget']")
      .forEach((s) => {
        s.after(createSpellDisplay({ text: "Hit/Save DC:", attr: "attr_spelldc" }));
      });

    //refresh ui
    var flag = document.querySelector(".spell-container .repcontainer .spell .details-flag");
    flag.click();
    flag.click();

    // load filters
    updateFilter();

    // load custom data
    spellData.additionalInfo.forEach((r) => {
      var row = document.querySelector(`.spell-container [data-reprowid='${r.id}']`);
      if (row !== undefined) {
        Object.keys(r).forEach((attr) => {
          if (attr !== "id") {
            row.querySelector(`input[name="${attr}"`).value = r[attr];
            row.querySelectorAll(`span[name="${attr}"`).forEach((t) => (t.textContent = r[attr]));
          }
        });
      }
    });
  }

  function createSpellFilter() {
    var container = document.createElement("div");
    container.className = "c20-spellFilter";

    var btn = document.createElement("div");
    btn.className = "filterBtn";

    var btnImg = document.createElement("img");
    btnImg.src = chrome.runtime.getURL(`library/icons/filter-solid-full.svg`);
    btn.appendChild(btnImg);

    btn.addEventListener("click", function () {
      btn.classList.toggle("open");
    });
    container.appendChild(btn);

    var inputContainer = document.createElement("div");
    inputContainer.className = "inputContainer";

    var exclusiveContainer = document.createElement("div");
    exclusiveContainer.appendChild(createSpellFilterCheckbox("prepared"));
    exclusiveContainer.appendChild(createSpellFilterCheckbox("ritual"));

    var inclusiveFilter = document.createElement("div");
    inclusiveFilter.style.display = "inline-block";
    inclusiveFilter.appendChild(createSpellFilterCheckbox("verbal"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("somatic"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("material"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("concentration"));

    inputContainer.appendChild(exclusiveContainer);
    inputContainer.appendChild(inclusiveFilter);
    container.appendChild(inputContainer);
    document.querySelector(".page.spells .col.col1").before(container);
  }

  function createSpellFilterCheckbox(key) {
    var group = document.createElement("div");

    var input = document.createElement("input");
    input.type = "checkbox";
    input.name = `c20-spellFilter-${key}`;
    input.id = `c20-spellFilter-${key}`;
    input.checked = spellData.filter[key];

    var label = document.createElement("label");
    label.textContent = key;
    label.setAttribute("for", `c20-spellFilter-${key}`);
    label.className = "c20-label";

    input.addEventListener("change", function (event) {
      spellData.filter[key] = event.target.checked;
      updateFilter();
    });

    group.appendChild(input);
    group.appendChild(label);

    return group;
  }

  function updateFilter() {
    document.querySelectorAll(".spell-container > .repcontainer .spell").forEach((spell) => {
      if (spellData.filter.prepared === true && spell.querySelector(".display .prep-box:not(:checked)")) {
        spell.classList.add("hidden");
      } else if (spellData.filter.verbal === false && spell.querySelector(".display input.v").value !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.somatic === false && spell.querySelector(".display input.s").value !== "0") {
        spell.classList.add("hidden");
      } else if (spellData.filter.material === false && spell.querySelector(".display input.m").value !== "0") {
        spell.classList.add("hidden");
      } else if (
        spellData.filter.concentration === false &&
        spell.querySelector(".display input.spellconcentration").value !== "0"
      ) {
        spell.classList.add("hidden");
      } else if (spellData.filter.ritual === true && spell.querySelector(".display input.spellritual").value === "0") {
        spell.classList.add("hidden");
      } else {
        spell.classList.remove("hidden");
      }
    });

    if (defaultFilter === JSON.stringify(spellData.filter))
      document.querySelector(".c20-spellFilter .filterBtn").classList.remove("active");
    else document.querySelector(".c20-spellFilter .filterBtn").classList.add("active");
    saveState();
  }

  function createSpellHeader(container, index) {
    var header = document.createElement("div");
    header.className = "spellHeader";

    var name = document.createElement("div");
    name.className = "spellName";
    name.textContent = "Name";
    header.appendChild(name);

    var time = document.createElement("div");
    time.className = "spellTime";
    time.textContent = "Time";
    header.appendChild(time);

    var range = document.createElement("div");
    range.className = "spellRange";
    range.textContent = "Range";
    header.appendChild(range);

    var target = document.createElement("div");
    target.className = "spellTarget";
    target.textContent = "Target";
    header.appendChild(target);

    var duration = document.createElement("div");
    duration.className = "spellDuration";
    duration.textContent = "Duration";
    header.appendChild(duration);

    var dc = document.createElement("div");
    dc.className = "spellDC";
    dc.textContent = "DC";
    header.appendChild(dc);

    container.insertBefore(header, container.firstChild);
  }

  function createSpellRow(container) {
    var time = document.createElement("span");
    time.className = "spellTime";
    time.setAttribute("name", "attr_spellcastingtime");

    var range = document.createElement("span");
    range.className = "spellRange";
    range.setAttribute("name", "attr_spellrange");

    var target = document.createElement("span");
    target.className = "spellTarget";
    target.setAttribute("name", "attr_spelltarget");

    var duration = document.createElement("span");
    duration.className = "spellDuration";
    duration.setAttribute("name", "attr_spellduration");

    var dc = document.createElement("span");
    dc.className = "spellDC";
    dc.setAttribute("name", "attr_spelldc");

    container.appendChild(time);
    container.appendChild(range);
    container.appendChild(target);
    container.appendChild(duration);
    container.appendChild(dc);
  }

  function createSpellOption(data) {
    var row = document.createElement("div");
    row.className = " row";

    var span = document.createElement("span");
    span.textContent = data.text;
    span.style.paddingRight = "4px";

    var input = document.createElement("input");
    input.type = "text";
    input.name = data.attr;

    if (spellData.additionalInfo)
      input.addEventListener("change", function (event) {
        var repEl = row.parentElement.parentElement.parentElement.parentElement;
        var id = repEl.getAttribute("data-reprowid");
        var index = spellData.additionalInfo.findIndex((x) => x.id === id && x[data.attr] !== undefined);

        repEl.querySelectorAll(`span[name="${data.attr}"]`).forEach((s) => (s.textContent = event.target.value));
        if (index !== -1) spellData.additionalInfo[index][data.attr] = event.target.value;
        else spellData.additionalInfo.push({ id: id, [data.attr]: event.target.value });
        saveState();
      });

    row.appendChild(span);
    row.appendChild(input);
    return row;
  }

  function createSpellDisplay(data) {
    var row = document.createElement("div");
    row.className = " row";

    var label = document.createElement("span");
    label.textContent = data.text;
    label.className = "bold";

    var value = document.createElement("span");
    value.setAttribute("name", data.attr);

    row.appendChild(label);
    row.appendChild(value);
    return row;
  }

  async function saveState() {
    await chrome.storage.local.set({ [storageKey]: spellData });
  }

  async function loadState() {
    var storedData = await chrome.storage.local.get([storageKey]);
    if (storedData[storageKey] !== undefined) spellData = storedData[storageKey];
  }

  var Spells = {
    init: async function init() {
      storageKey = window.character_id + "-spells";
      await loadState();
      createUi();
    },
  };
  return Spells;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Spells;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Spells;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Spells", []).factory("Spells", function () {
    return Spells;
  });
}
