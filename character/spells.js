//Start with viewer
//Table view
//Name (C/R Tags) | Time | Range | Target | DC | Duration | VSM
//Accordion for each spell level
//Filter (Prepared/Ritual/VSM/Concentration)

var Spells = (function () {
  function createUi() {
    var page = document.querySelector(".page.spells");
    page.classList.add("c20-v2");

    document.querySelectorAll(".spell-container").forEach((s, i) => createSpellHeader(s, i));
    document.querySelectorAll(".spell-container .spell > .display > button").forEach((s) => createSpellRow(s));

    //refresh ui
    var flag = document.querySelector(".spell-container .repcontainer .spell .details-flag");
    flag.click();
    flag.click();
  }

  function createSpellFilter() {}

  function createSpellHeader(container, index) {
    var header = document.createElement("div");
    header.className = "spellHeader";
    if (index !== 0) header.style.paddingLeft = "15px";

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
