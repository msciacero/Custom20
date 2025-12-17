var MiniNotes = (function () {
  var settings = {
    isLocked: true,
    sortNode: null,
    storageKey: null,
  };
  var savedState = {
    isHidden: false,
    selected: "Characteristics",
    notes: [
      {
        name: "Actions",
        items: [
          {
            id: "d8f43a5b-25ed-4575-b200-be7cda295945",
            name: "Attack",
            desc: 'The most common action to take in combat is the Attack action, whether you are swinging a sword, firing an arrow from a bow, or brawling with your fists.\n\nWith this action, you make one melee or ranged attack. See the "Making an Attack" section for the rules that govern attacks.\n\nCertain features, such as the Extra Attack feature of the fighter, allow you to make more than one attack with this action.',
            isOpen: false,
          },
          {
            id: "35311cf1-4dec-4a33-8938-7e56a4686f88",
            name: "Spell",
            desc: "Spellcasters such as wizards and clerics, as well as many monsters, have access to spells and can use them to great effect in combat. Each spell has a casting time, which specifies whether the caster must use an action, a reaction, minutes, or even hours to cast the spell. Casting a spell is, therefore, not necessarily an action. Most spells do have a casting time of 1 action, so a spellcaster often uses his or her action in combat to cast such a spell.",
            isOpen: false,
          },
          {
            id: "2d5e65ec-2fe4-4f4c-90d4-e33e4f65d2d0",
            name: "Dash",
            desc: "When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. With a speed of 30 feet, for example, you can move up to 60 feet on your turn if you dash.\n\nAny increase or decrease to your speed changes this additional movement by the same amount. If your speed of 30 feet is reduced to 15 feet, for instance, you can move up to 30 feet this turn if you dash.",
            isOpen: false,
          },
          {
            id: "70383cbc-a085-46df-8359-2e0a35f84133",
            name: "Disengage",
            desc: "If you take the Disengage action, your movement doesn't provoke opportunity attacks for the rest of the turn.",
            isOpen: false,
          },
          {
            id: "ca7878ab-48a3-4aa8-9acb-2e56bc0aabbc",
            name: "Dodge",
            desc: "When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or if your speed drops to 0.",
            isOpen: false,
          },
          {
            id: "17a48673-12b1-48ed-8457-12bacc243056",
            name: "Help",
            desc: "You can lend your aid to another creature in the completion of a task. When you take the Help action, the creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn.\n\nAlternatively, you can aid a friendly creature in attacking a creature within 5 feet of you. You feint, distract the target, or in some other way team up to make your ally's attack more effective. If your ally attacks the target before your next turn, the first attack roll is made with advantage.",
            isOpen: false,
          },
          {
            id: "e78bf5f6-3dd4-4311-a9ff-18bb31829336",
            name: "Hide",
            desc: 'When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding. If you succeed, you gain certain benefits, as described in the "Unseen Attackers and Targets" section later in this section.',
            isOpen: false,
          },
          {
            id: "8944586d-1c79-49f7-9616-8b09a0339a79",
            name: "Ready",
            desc: 'Sometimes you want to get the jump on a foe or wait for a particular circumstance before you act. To do so, you can take the Ready action on your turn, which lets you act using your reaction before the start of your next turn.\n\nFirst, you decide what perceivable circumstance will trigger your reaction. Then, you choose the action you will take in response to that trigger, or you choose to move up to your speed in response to it. Examples include "If the cultist steps on the trapdoor, I\'ll pull the lever that opens it," and "If the goblin steps next to me, I move away."\n\nWhen the trigger occurs, you can either take your reaction right after the trigger finishes or ignore the trigger. Remember that you can take only one reaction per round.\n\nWhen you ready a spell, you cast it as normal but hold its energy, which you release with your reaction when the trigger occurs. To be readied, a spell must have a casting time of 1 action, and holding onto the spell\'s magic requires concentration. If your concentration is broken, the spell dissipates without taking effect. For example, if you are concentrating on the web spell and ready magic missile, your web spell ends, and if you take damage before you release magic missile with your reaction, your concentration might be broken.',
            isOpen: false,
          },
          {
            id: "6bac36d5-9d47-4d29-8a91-487629b74773",
            name: "Search",
            desc: "When you take the Search action, you devote your attention to finding something. Depending on the nature of your search, the DM might have you make a Wisdom (Perception) check or an Intelligence (Investigation) check.",
            isOpen: false,
          },
          {
            id: "d52f2611-23fa-485b-ba81-445097322f3f",
            name: "Use an Object",
            desc: "You normally interact with an object while doing something else, such as when you draw a sword as part of an attack. When an object requires your action for its use, you take the Use an Object action. This action is also useful when you want to interact with more than one object on your turn.",
            isOpen: false,
          },
        ],
      },
      {
        name: "Bonus Actions",
        items: [],
      },
      {
        name: "Characteristics",
      },
      {
        name: "Reactions",
        items: [],
      },
    ],
  };

  function createUi() {
    var connector = document.querySelector(".rp-traits");

    var header = document.createElement("div");
    header.className = "miniNote-header";
    header.appendChild(createMenu());

    connector.before(header);
    connector.after(createMiniNote());
  }

  function createMenu() {
    var container = document.createElement("div");
    container.className = "miniNote-dropdown";

    var select = document.createElement("select");
    select.id = "miniNote-select";
    select.name = "miniNote-select";

    savedState.notes
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      })
      .forEach((o) => {
        var option = document.createElement("option");
        option.value = o.name;
        option.textContent = o.name;
        if (o.name === savedState.selected) option.selected = "selected";
        select.appendChild(option);
      });

    // change notes
    select.addEventListener("change", function (event) {
      savedState.selected = event.target.value;
      var rp = document.querySelector(".rp-traits");
      var note = document.querySelector(".miniNote-container");

      if (savedState.selected === "Characteristics") {
        note.classList.add("hidden");
        rp.classList.remove("hidden");
      } else {
        updateMiniNote(savedState.notes.find((x) => x.name === savedState.selected));
        rp.classList.add("hidden");
        note.classList.remove("hidden");
      }
      saveState();
    });

    container.appendChild(select);
    return container;
  }

  function createMiniNote() {
    var container = document.createElement("div");
    container.className = "miniNote-container hidden";

    var rootFolder = document.createElement("div");
    rootFolder.className = "miniNote-folder";

    container.appendChild(createTitle());
    container.appendChild(rootFolder);
    container.appendChild(createControls());

    settings.sortNode = Sortable.create(rootFolder, {
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      handle: ".repcontrol_move",
      //draggable: ".miniNote-item",
      disabled: settings.isLocked,
      store: {
        set: function () {
          updateState();
        },
      },
    });

    return container;
  }

  function updateMiniNote(note) {
    var title = document.querySelector(".miniNote-title span");
    title.textContent = note.name;

    var items = [];

    for (var i = 0; i < note.items.length; i++) {
      items.push(createItem(note.items[i]));
    }

    document.querySelector(".miniNote-title span").textContent = note.name;
    document.querySelector(".miniNote-folder").replaceChildren(...items);
  }

  function createTitle() {
    var containerTitle = document.createElement("div");
    containerTitle.className = "miniNote-title";

    var span = document.createElement("span");
    span.textContent = "note";

    // hide/show notes
    containerTitle.addEventListener("click", function () {
      savedState.isHidden = !savedState.isHidden;
      document.querySelector(".miniNote-folder").classList.toggle("hidden");
      document.querySelector(".miniNote-controls").classList.toggle("hidden");
      saveState();
    });

    containerTitle.appendChild(span);
    return containerTitle;
  }

  function createItem(data) {
    var container = document.createElement("div");
    container.className = "miniNote-item";
    container.setAttribute("data-itemid", data.id);

    var input = document.createElement("input");
    input.className = "options-flag";
    input.type = "checkbox";
    input.name = `options-flag-${data.id}`;
    if (data.name === undefined) input.checked = "checked";

    var span = document.createElement("span");
    span.textContent = "y";

    var options = createItemOptions(data);
    var display = createItemDisplay(data);

    input.addEventListener("change", function (event) {
      if (event.target.checked) {
        display.style.display = "none";
        options.style.display = "block";
      } else {
        display.style.display = "block";
        options.style.display = "none";
      }
    });

    container.appendChild(createItemControls(data));
    container.appendChild(input);
    container.appendChild(span);
    container.appendChild(options);
    container.appendChild(display);

    return container;
  }

  function createItemOptions(data) {
    var options = document.createElement("options");
    options.className = "options";
    if (data.isNew !== true) options.style.display = "none";

    var nameRow = document.createElement("div");
    nameRow.className = "row";

    var nameSpan = document.createElement("span");
    nameSpan.textContent = "NAME: ";

    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.name = `name-${data.id}`;
    nameInput.value = data.name ?? "";
    nameInput.style.width = "78%";
    nameInput.style.paddingLeft = "2px";

    nameRow.appendChild(nameSpan);
    nameRow.appendChild(nameInput);
    options.appendChild(nameRow);

    var descRow = document.createElement("div");
    descRow.className = "row";

    var desc = document.createElement("textarea");
    desc.name = `desc-${data.id}`;
    desc.value = data.desc ?? "";
    desc.style.minHeight = "150px";
    desc.style.height = "150px";
    desc.style.width = "95%";

    descRow.appendChild(desc);
    options.appendChild(descRow);

    nameInput.addEventListener("change", function (event) {
      document.querySelector(`.miniNote-item[data-itemid="${data.id}"] .miniNote-item-name`).textContent =
        event.target.value;
      updateState();
    });

    desc.addEventListener("change", function (event) {
      document.querySelector(`.miniNote-item[data-itemid="${data.id}"] .miniNote-item-desc`).textContent =
        event.target.value;
      updateState();
    });

    return options;
  }

  function createItemDisplay(data) {
    var display = document.createElement("details");
    display.style.marginBottom = "2px";
    if (data.isOpen === true) display.setAttribute("open", "");
    if (data.isNew === true) display.style.display = "none";

    var title = document.createElement("summary");
    title.className = "miniNote-item-name";
    title.textContent = data.name ?? "";

    var desc = document.createElement("p");
    desc.className = "miniNote-item-desc";
    desc.textContent = data.desc ?? "";

    display.appendChild(title);
    display.appendChild(desc);

    //expand/collapse
    display.addEventListener("toggle", function () {
      updateState();
    });

    return display;
  }

  function createItemControls(data) {
    var container = document.createElement("div");
    container.className = "itemcontrol";

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger pictos repcontrol_del";
    deleteBtn.textContent = "#";

    var moveHandle = document.createElement("a");
    moveHandle.className = "btn repcontrol_move";
    moveHandle.textContent = "≡";

    // delete note
    deleteBtn.addEventListener("click", function () {
      document.querySelector(`.miniNote-item[data-itemid="${data.id}`).remove();
      updateState();
    });

    container.appendChild(deleteBtn);
    container.appendChild(moveHandle);

    return container;
  }

  function createControls() {
    var control = document.createElement("div");
    control.className = "miniNote-controls";

    var editButton = document.createElement("button");
    editButton.className = "btn miniNote-controls-edit";
    editButton.textContent = "Modify";

    var addButton = document.createElement("button");
    addButton.className = "btn miniNote-controls-add";
    addButton.textContent = "+Add";

    // add new note
    addButton.addEventListener("click", function () {
      var folder = Array.from(document.querySelectorAll(".miniNote-folder")).at(-1);
      folder.appendChild(createItem({ id: crypto.randomUUID(), isOpen: false, isNew: true }));
      updateState();
    });

    editButton.addEventListener("click", function () {
      settings.isLocked = !settings.isLocked;
      settings.sortNode.option("disabled", settings.isLocked);
      document.querySelector(".miniNote-container").classList.toggle("edit-mode");
    });

    control.appendChild(editButton);
    control.appendChild(addButton);
    return control;
  }

  async function updateState() {
    // find current note and update just that section
    var note = {
      name: document.querySelector(".miniNote-title").textContent,
      items: Array.from(document.querySelectorAll(".miniNote-item")).map((i) => {
        var details = i.querySelector("details");
        return {
          id: i.getAttribute("data-itemid"),
          name: details.childNodes[0].textContent,
          desc: details.childNodes[1].textContent,
          isOpen: details.hasAttribute("open"),
        };
      }),
    };

    var index = savedState.notes.findIndex((x) => x.name === note.name);
    if (index === -1) savedState.notes.push(note);
    else savedState.notes[index] = note;

    await saveState();
  }

  async function saveState() {
    await chrome.storage.local.set({ [settings.storageKey]: JSON.stringify(savedState) });
  }

  async function loadState() {
    var storedData = await chrome.storage.local.get([settings.storageKey]);
    if (storedData[settings.storageKey] !== undefined) savedState = JSON.parse(storedData[settings.storageKey]);
  }

  var MiniNotes = {
    init: async function init() {
      settings.storageKey = window.character_id + "-notes";
      await loadState();
      createUi();

      if (savedState.isHidden === true) {
        document.querySelector(".miniNote-folder").classList.toggle("hidden");
        document.querySelector(".miniNote-controls").classList.toggle("hidden");
      }

      if (savedState.selected !== "Characteristics") {
        var rp = document.querySelector(".rp-traits");
        var note = document.querySelector(".miniNote-container");

        updateMiniNote(savedState.notes.find((x) => x.name === savedState.selected));
        rp.classList.add("hidden");
        note.classList.remove("hidden");
      }
    },
  };
  return MiniNotes;
})();

if (typeof define === "function" && define.amd) {
  define(function () {
    return MiniNotes;
  });
} else if (typeof module !== "undefined" && module != null) {
  module.exports = MiniNotes;
} else if (typeof angular !== "undefined" && angular != null) {
  angular.module("MiniNotes", []).factory("MiniNotes", function () {
    return MiniNotes;
  });
}
