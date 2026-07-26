var Characteristics = (function () {
  function createUi() {
    const rpContainer = document.querySelector(".page .rp-traits");
    if (!rpContainer) return;

    rpContainer.classList.add("c20-v2");

    document.querySelectorAll(".page .rp-traits.c20-v2 .pibf .display").forEach((x) => {
      createDescription(x);
    });

    document.querySelectorAll(".page .rp-traits.c20-v2 .pibf").forEach((x) => {
      updateDescription(x);
    });

    rpContainer.addEventListener("change", checkForUpdates);
  }

  function checkForUpdates(event) {
    if (event.target.localName === "textarea") {
      const traitContainer = event.target.closest(".pibf");
      if (traitContainer) updateDescription(traitContainer);
    }
  }

  function createDescription(container) {
    if (container.querySelector(".c20-desc")) return container.querySelector(".c20-desc");

    const span = document.createElement("span");
    span.className = "c20-desc";
    container.appendChild(span);
    return span;
  }

  function updateDescription(container) {
    if (!container) return;

    const inputEl = container.querySelector(".options textarea");
    if (!inputEl) return;

    const displayContainer = container.querySelector(".display");
    if (!displayContainer) return;

    let descSpan = displayContainer.querySelector(".c20-desc");
    if (!descSpan) {
      descSpan = createDescription(displayContainer);
    }

    const markdownNode = createMarkdownDisplay(inputEl.value);
    descSpan.replaceChildren(markdownNode);
  }

  var Characteristics = {
    init: function init() {
      createUi();
    },
    remove: function remove() {
      const selector = document.querySelector(".page .rp-traits.c20-v2");
      if (!selector) return;

      selector.querySelectorAll(".c20-desc").forEach((x) => x.remove());
      selector.removeEventListener("change", checkForUpdates);
      selector.classList.remove("c20-v2");
    },
  };
  return Characteristics;
})();
