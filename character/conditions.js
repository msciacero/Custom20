var Conditions = (function () {
  var storageKey;

  var conditions = {
    blinded: false,
    charmed: false,
    deafened: false,
    exhaustion: false,
    frightened: false,
    grappled: false,
    incapacitated: false,
    invisible: false,
    paralyzed: false,
    petrified: false,
    poisoned: false,
    prone: false,
    restrained: false,
    stunned: false,
    unconscious: false,
  };

  var effects = {
    ability: "Ability Checks",
    actions: "Actions",
    attack: "Attacks",
    defense: "Attacks Against",
    health: "Health/Defense",
    movement: "Movement",
    reactions: "Reactions",
    saves: "Saving Throws",
  };

  var conditions14 = {
    blinded: {
      desc: [
        "A blinded creature can't see and automatically fails any ability check that requires sight.",
        "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
      ],
      tags: [effects.attack, effects.defense, effects.ability],
    },
    charmed: {
      desc: [
        "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects.",
        "The charmer has advantage on any ability check to interact socially with the creature.",
      ],
      tags: [effects.attack],
    },
    deafened: {
      desc: ["A deafened creature can't hear and automatically fails any ability check that requires hearing."],
      tags: [effects.ability],
    },
    exhaustion1: {
      desc: ["Disadvantage on ability checks"],
      tags: [effects.ability],
    },
    exhaustion2: {
      desc: ["Disadvantage on ability checks", "Speed halved"],
      tags: [effects.ability, effects.movement],
    },
    exhaustion3: {
      desc: ["Disadvantage on ability checks", "Speed halved", "Disadvantage on attack rolls and saving throws"],
      tags: [effects.ability, effects.movement, effects.saves, effects.attack],
    },
    exhaustion4: {
      desc: [
        "Disadvantage on ability checks",
        "Speed halved",
        "Disadvantage on attack rolls and saving throws",
        "Hit point maximum halved",
      ],
      tags: [effects.ability, effects.movement, effects.saves, effects.attack, effects.health],
    },
    exhaustion5: {
      desc: [
        "Disadvantage on ability checks",
        "SSpeed reduced to 0",
        "Disadvantage on attack rolls and saving throws",
        "Hit point maximum halved",
      ],
      tags: [effects.ability, effects.movement, effects.saves, effects.attack, effects.health],
    },
    frightened: {
      desc: [
        "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.",
        "The creature can't willingly move closer to the source of its fear.",
      ],
      tags: [effects.ability, effects.attack, effects.movement],
    },
    grappled: {
      desc: [
        "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
        "The condition ends if the grappler is incapacitated (no action or reaction).",
        "The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect, such as when a creature is hurled away by the thunderwave spell.",
      ],
      tags: [effects.movement],
    },
    incapacitated: {
      desc: ["An incapacitated creature can't take actions or reactions."],
      tags: [effects.actions, effects.reactions],
    },
    invisible: {
      desc: [
        "An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves.",
        "Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
      ],
      tags: [effects.attack, effects.defense],
    },
    paralyzed: {
      desc: [
        "A paralyzed creature is incapacitated (no action or reaction) and can't move or speak.",
        "The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
        "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
      ],
      tags: [effects.actions, effects.reactions, effects.movement, effects.saves, effects.defense],
    },
    petrified: {
      desc: [
        "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.",
        "The creature is incapacitated (no action or reaction), can't move or speak, and is unaware of its surroundings.",
        "Attack rolls against the creature have advantage.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "The creature has resistance to all damage.",
        "The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.",
      ],
      tags: [effects.actions, effects.reactions, effects.movement, effects.defense, effects.saves, effects.health],
    },
    poisoned: {
      desc: ["A poisoned creature has disadvantage on attack rolls and ability checks."],
      tags: [effects.attack, effects.ability],
    },
    prone: {
      desc: [
        "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition.",
        "The creature has disadvantage on attack rolls.",
        "An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.",
      ],
      tags: [effects.movement, effects.attack, effects.defense],
    },
    restrained: {
      desc: [
        "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed.",
        "Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
        "The creature has disadvantage on Dexterity saving throws.",
      ],
      tags: [effects.movement, effects.defense, effects.attack, effects.saves],
    },
    stunned: {
      desc: [
        "A stunned creature is incapacitated (no action or reaction), can't move, and can speak only falteringly.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have advantage.",
      ],
      tags: [effects.actions, effects.reactions, effects.movement, effects.saves, effects.defense],
    },
    unconscious: {
      desc: [
        "An unconscious creature is incapacitated (no action or reaction), can't move or speak, and is unaware of its surroundings.",
        "The creature drops whatever it's holding and falls prone.",
        "The creature automatically fails Strength and Dexterity saving throws.",
        "Attack rolls against the creature have advantage.",
        "Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
      ],
      tags: [effects.actions, effects.reactions, effects.movement, effects.saves, effects.defense],
    },
  };

  function createOptions() {
    var options = document.createElement("div");
    options.className = "options";
    options.style.display = "none";

    var checkboxContainer = document.createElement("div");
    checkboxContainer.style.marginLeft = "15px";
    checkboxContainer.style.columnCount = "2";

    Object.keys(conditions).forEach((key) => {
      if (!key.startsWith("exhaustion")) {
        var group = document.createElement("div");

        var input = document.createElement("input");
        input.type = "checkbox";
        input.name = `c20-conditions-${key}`;
        input.id = `c20-conditions-${key}`;
        input.checked = conditions[key];

        var label = document.createElement("label");
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        label.setAttribute("for", `c20-conditions-${key}`);
        label.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        label.style.fontSize = "9px";
        label.style.fontWeight = 700;
        label.style.display = "inline";
        label.style.marginLeft = "2px";

        input.addEventListener("change", function (event) {
          conditions[key] = event.target.checked;
          document.querySelector(`.conditions .c20-conditions-${key}`).style.display = conditions[key]
            ? "list-item"
            : "none";
          document.querySelector(`.conditions .c20-conditions-none`).style.display = Object.values(conditions).find(
            (x) => x
          )
            ? "none"
            : "list-item";
          updateEffectLabels();
          saveConditions();
        });

        group.appendChild(input);
        group.appendChild(label);
        checkboxContainer.appendChild(group);
      }
    });

    //exhaustion
    var radioContainer = document.createElement("div");
    radioContainer.className = "c20-exhaustion";
    radioContainer.style.display = "flex";
    radioContainer.style.margin = "10px 0 0 20px";
    radioContainer.style.fontSize = "9px";
    radioContainer.style.fontWeight = 700;

    var title = document.createElement("div");
    title.textContent = "Exhaustion: ";
    title.style.margin = "2px 5px 0 0";
    radioContainer.appendChild(title);

    for (var i = 1; i <= 5; i++) {
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "condition-exhaustion";
      input.id = `c20-conditions-exhaustion-${i}`;
      input.checked = conditions.exhaustion === i.toString();

      var label = document.createElement("label");
      label.setAttribute("for", `c20-conditions-exhaustion-${i}`);
      label.textContent = i;

      input.addEventListener("click", function (event) {
        var display = document.querySelector(".conditions .c20-conditions-exhaustion");
        var num = event.target.id.charAt(26);
        if (conditions.exhaustion === num) {
          this.checked = false;
          conditions.exhaustion = false;
          display.style.display = "none";
        } else {
          conditions.exhaustion = num;
          display.textContent = "Exhaustion " + num;
          display.style.display = "list-item";
        }

        document.querySelector(`.conditions .c20-conditions-none`).style.display = Object.values(conditions).find(
          (x) => x
        )
          ? "none"
          : "list-item";

        updateEffectLabels();
        saveConditions();
      });

      radioContainer.appendChild(input);
      radioContainer.appendChild(label);
    }

    options.appendChild(checkboxContainer);
    options.appendChild(radioContainer);

    return options;
  }

  function createConditionLabel(key) {
    var conditionLabel = document.createElement("div");
    conditionLabel.className = `c20-conditions-${key}`;
    if (key === "exhaustion" && conditions[key] !== false) conditionLabel.textContent = "Exhaustion " + conditions[key];
    else conditionLabel.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    conditionLabel.style.display = conditions[key] ? "list-item" : "none";
    conditionLabel.style.cursor = "pointer";

    conditionLabel.addEventListener("click", function () {
      var modal = document.querySelector("#c20-conditions-modal");
      var title = modal.querySelector("#c20-conditions-modal-title");
      var descKey = key;

      if (key === "exhaustion") {
        title.textContent = "Exhaustion " + conditions[key];
        descKey = "exhaustion" + conditions[key];
      } else title.textContent = key.charAt(0).toUpperCase() + key.slice(1);

      var content = modal.querySelector("#c20-conditions-modal-content");
      content.replaceChildren();

      conditions14[descKey].desc.forEach((desc) => {
        var item = document.createElement("div");
        item.style.display = "list-item";
        item.textContent = desc;
        content.appendChild(item);
      });

      modal.style.display = "block";
    });

    return conditionLabel;
  }

  function createEffectsLabel(key) {
    var effectLabel = document.createElement("div");
    effectLabel.className = `c20-conditions-effects-${key}`;
    effectLabel.textContent = effects[key];
    effectLabel.style.display = "none";

    return effectLabel;
  }

  function updateEffectLabels() {
    // find enabled effects
    var enabledEffects = Object.keys(conditions)
      .filter((x) => conditions[x] !== false)
      .flatMap((x) =>
        x === "exhaustion" ? conditions14[`exhaustion${conditions.exhaustion}`].tags : conditions14[x].tags
      );

    enabledEffects = [...new Set(enabledEffects)];

    // display enabled effects
    Object.keys(effects).forEach((key) => {
      var label = document.querySelector(`.c20-conditions-effects-${key}`);
      if (enabledEffects.includes(effects[key])) label.style.display = "list-item";
      else label.style.display = "none";
    });
  }

  function createDisplay() {
    var display = document.createElement("div");
    display.className = "display";
    display.style.marginLeft = "20px";

    // condition labels
    var displayList = document.createElement("div");
    displayList.style.width = "50%";

    Object.keys(conditions).forEach((key) => {
      displayList.appendChild(createConditionLabel(key));
    });

    // default condition label
    var conditionLabel = document.createElement("div");
    conditionLabel.className = `c20-conditions-none`;
    conditionLabel.textContent = "None";
    conditionLabel.style.display = Object.values(conditions).find((x) => x) ? "none" : "list-item";
    displayList.appendChild(conditionLabel);

    // effects labels
    var effectsList = document.createElement("div");
    Object.keys(effects).forEach((key) => {
      effectsList.appendChild(createEffectsLabel(key));
    });

    // panel label
    var label = document.createElement("span");
    label.className = "label";
    label.style.setProperty("text-align", "center", "important");
    label.style.display = "inline-block";
    label.style.width = "95%";
    label.setAttribute("data-i18n", "conditions");
    label.textContent = "CONDITIONS";

    var listHolder = document.createElement("div");
    listHolder.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    listHolder.style.fontSize = "11px";
    listHolder.style.display = "flex";

    listHolder.appendChild(displayList);
    listHolder.appendChild(effectsList);
    display.appendChild(listHolder);
    display.appendChild(label);

    return display;
  }

  function createDisplayModal() {
    var modal = document.createElement("div");
    modal.className = `modal`;
    modal.id = "c20-conditions-modal";

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    var modalTitle = document.createElement("h3");
    modalTitle.id = "c20-conditions-modal-title";
    modalTitle.style.display = "inline-block";

    var modalClose = document.createElement("span");
    modalClose.className = "close";
    modalClose.style.fontFamily = "pictos";
    modalClose.textContent = "*";

    var conditionContent = document.createElement("div");
    conditionContent.id = "c20-conditions-modal-content";
    conditionContent.style.marginLeft = "15px";

    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalClose);
    modalContent.appendChild(conditionContent);
    modal.appendChild(modalContent);

    modalClose.onclick = function () {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    return modal;
  }

  function createUi() {
    var container = document.createElement("div");
    container.className = "conditions";

    var input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = "attr_options-flag-conditions";

    var inputDisplay = document.createElement("span");
    inputDisplay.textContent = "y";

    var display = createDisplay();
    var options = createOptions();
    var modal = createDisplayModal();

    container.appendChild(input);
    container.appendChild(inputDisplay);
    container.appendChild(display);
    container.appendChild(options);
    document.querySelector(".vitals").after(container);
    document.querySelector("body").appendChild(modal);

    input.addEventListener("change", function (event) {
      if (event.target.checked) {
        display.style.display = "none";
        options.style.display = "block";
      } else {
        display.style.display = "block";
        options.style.display = "none";
      }
    });
  }

  //save
  function saveConditions() {
    chrome.storage.local.set({ [storageKey]: LZString.compressToUTF16(JSON.stringify(conditions)) });
  }

  //load
  async function loadConditions() {
    var storedData = await chrome.storage.local.get([storageKey]);
    if (storedData[storageKey] === undefined) return;

    conditions = JSON.parse(LZString.decompressFromUTF16(storedData[storageKey]));
  }

  var Conditions = {
    init: async function init() {
      storageKey = window.character_id + "-conditions";
      await loadConditions();
      createUi();
      updateEffectLabels();
    },
  };
  return Conditions;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return Conditions;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = Conditions;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("Conditions", []).factory("Conditions", function () {
    return Conditions;
  });
}
