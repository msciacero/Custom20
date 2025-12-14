//TODO
// prefill import spell casting ability with spell
// new spell updates w/filter

var Spells = (function () {
  var defaultFilter = {
    concentration: true,
    material: true,
    prepared: false,
    ritual: false,
    somatic: true,
    time: "",
    verbal: true,
  };

  var spellData = {
    filter: {
      concentration: true,
      material: true,
      prepared: false,
      ritual: false,
      somatic: true,
      time: "",
      verbal: true,
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
    if (flag !== null) {
      flag.click();
      flag.click();
    }

    // load filters
    updateFilter();
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

    var selectContainer = document.createElement("div");
    selectContainer.className = "selectContainer";
    selectContainer.appendChild(createSpellFilterSelect("time", "castingtime"));

    var checkBoxContainer = document.createElement("div");
    checkBoxContainer.className = "checkboxContainer";

    var exclusiveContainer = document.createElement("div");
    exclusiveContainer.appendChild(createSpellFilterCheckbox("prepared"));
    exclusiveContainer.appendChild(createSpellFilterCheckbox("ritual"));

    var inclusiveFilter = document.createElement("div");
    inclusiveFilter.style.display = "inline-block";
    inclusiveFilter.appendChild(createSpellFilterCheckbox("verbal"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("somatic"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("material"));
    inclusiveFilter.appendChild(createSpellFilterCheckbox("concentration"));

    checkBoxContainer.appendChild(exclusiveContainer);
    checkBoxContainer.appendChild(inclusiveFilter);
    inputContainer.appendChild(checkBoxContainer);
    inputContainer.appendChild(selectContainer);

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
      saveState();
    });

    group.appendChild(input);
    group.appendChild(label);

    return group;
  }

  function createSpellFilterSelect(key, attrName) {
    var group = document.createElement("div");

    var label = document.createElement("label");
    label.textContent = key;
    label.setAttribute("for", `c20-spellFilter-${key}`);
    label.className = "c20-label";

    var select = document.createElement("select");
    select.id = `c20-spellFilter-${key}`;
    select.name = `c20-spellFilter-${key}`;
    select.value = spellData.filter[key];
    select.style.width = "auto";

    var options = [{ value: "", text: "Any" }];

    document.querySelectorAll(`.spell .details [name="attr_spell${attrName}"]`).forEach((el) => {
      if (!options.some((o) => o.value === el.textContent.toLowerCase())) {
        options.push({ value: el.textContent.toLowerCase(), text: el.textContent });
      }
    });

    options.forEach((optionData) => {
      var option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.text;
      select.appendChild(option);
    });

    select.addEventListener("change", function (event) {
      spellData.filter[key] = event.target.value;
      updateFilter();
      saveState();
    });

    group.appendChild(label);
    group.appendChild(select);

    return group;
  }

  function updateFilter() {
    // spell sheet
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
      } else if (
        spellData.filter.time !== "" &&
        spell.querySelector(`.display button .spellTime`).textContent.toLowerCase() !== spellData.filter.time
      ) {
        spell.classList.add("hidden");
      } else {
        spell.classList.remove("hidden");
      }
    });

    // core attacks & spell casting
    document.querySelectorAll(".attacks > .repcontainer > .repitem").forEach((attack) => {
      var spellId = attack.querySelector(`input[name="attr_spellid"]`).value;
      if (document.querySelector(`.spell-container .repitem[data-reprowid="${spellId}"] .spell.hidden`)) {
        attack.classList.add("hidden");
      } else {
        attack.classList.remove("hidden");
      }
    });

    // filter button state
    if (Object.keys(defaultFilter).every((key) => defaultFilter[key] === spellData.filter[key]))
      document.querySelector(".c20-spellFilter .filterBtn").classList.remove("active");
    else document.querySelector(".c20-spellFilter .filterBtn").classList.add("active");
  }

  function createSpellHeader(container) {
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

    var duration = document.createElement("div");
    duration.className = "spellDuration";
    duration.textContent = "Duration";
    header.appendChild(duration);

    var dc = document.createElement("div");
    dc.className = "spellSavingThrow";
    dc.textContent = "Save";
    header.appendChild(dc);

    var effect = document.createElement("div");
    effect.className = "spellEffect";
    effect.textContent = "Effect";
    header.appendChild(effect);

    container.insertBefore(header, container.firstChild);
  }

  function createSpellRow(container) {
    var time = document.createElement("span");
    time.className = "spellTime";
    time.setAttribute("name", "attr_spellcastingtime");

    var range = document.createElement("span");
    range.className = "spellRange";
    range.setAttribute("name", "attr_spellrange");

    var duration = document.createElement("span");
    duration.className = "spellDuration";
    duration.setAttribute("name", "attr_spellduration");

    var dc = document.createElement("span");
    dc.className = "spellSavingThrow";
    dc.setAttribute("name", "attr_spellsave");

    var roll = document.createElement("span");
    roll.className = "spellRoll";
    roll.setAttribute("name", "attr_spelldamage");

    var effect = document.createElement("span");
    effect.className = "spellEffect";
    effect.setAttribute("name", "attr_spelldamagetype");

    container.appendChild(time);
    container.appendChild(range);
    container.appendChild(duration);
    container.appendChild(dc);
    container.appendChild(roll);
    container.appendChild(effect);
  }

  async function saveState() {
    await StorageHelper.addOrUpdateItem(StorageHelper.dbNames.characters, window.character_id, spellData, "spells");
  }

  async function loadState() {
    var storedData = await StorageHelper.getItem(StorageHelper.dbNames.characters, window.character_id, "spells");
    if (storedData !== undefined) {
      Object.keys(defaultFilter).forEach((key) => {
        if (storedData.filter[key] === undefined) storedData.filter[key] = defaultFilter[key];
      });

      spellData = storedData;
    }
  }

  var Spells = {
    init: async function init() {
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
