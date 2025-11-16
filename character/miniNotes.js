var MiniNotes = (function () {
  var data = {
    isHidden: false,
    type: "action",
  };

  function createUi() {
    var connector = document.querySelector(".rp-traits");
    connector.before(createNoteMenu());
    connector.after(createActionNote());
  }

  function createNoteMenu() {
    var container = document.createElement("div");
    container.className = "c20-note-dropdown";
    container.textContent = "4";

    var content = document.createElement("div");
    content.className = "c20-note-dropdown-content";

    var options = ["character", "action"];
    options.forEach((o) => {
      var option = document.createElement("div");
      option.textContent = o;
      content.appendChild(option);
    });

    container.appendChild(content);
    return container;
  }

  function createActionNote() {
    var container = document.createElement("div");
    container.className = "c20-note";
    container.appendChild(createTitle("Action"));
  }

  function createBonusActionNote() {}

  function createReactionNote() {}

  function createTitle(name) {
    var containerTitle = document.createElement("div");
    containerTitle.className = "c20-note-title";

    var span = document.createElement("span");
    span.textContent = name;

    containerTitle.addEventListener("click", function () {
      data.isHidden = !data.isHidden;
    });

    containerTitle.appendChild(span);
    return containerTitle;
  }

  function createBody() {}

  var MiniNotes = {
    init: async function init() {
      createUi();
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
