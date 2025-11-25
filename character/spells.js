//TODO
//Save DC option??
//Save/Load

var Spells = (function () {
  var defaultFilter = JSON.stringify({
    prepared: false,
    ritual: false,
    verbal: true,
    somatic: true,
    material: true,
    concentration: true,
  });

  var spellData = {
    filter: {
      prepared: false,
      ritual: false,
      verbal: true,
      somatic: true,
      material: true,
      concentration: true,
    },
  };

  function createUi() {
    var page = document.querySelector(".page.spells");
    page.classList.add("c20-v2");

    createSpellFilter();

    document.querySelectorAll(".spell-container").forEach((s, i) => createSpellHeader(s, i));
    document.querySelectorAll(".spell-container .spell > .display > button").forEach((s) => createSpellRow(s));

    //refresh ui
    var flag = document.querySelector(".spell-container .repcontainer .spell .details-flag");
    flag.click();
    flag.click();
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
    dc.textContent = "Save";
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

  var Spells = {
    init: async function init() {
      settings.storageKey = window.character_id + "-spells";
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
