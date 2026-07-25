var Traits = (function () {
  var observer;
  const config = { childList: true, subtree: true };

  function createUi() {
    const traitsContainer = document.querySelector(".page .traits");
    if (!traitsContainer) return;

    traitsContainer.classList.add("c20-v2");

    // Initialize existing display descriptions
    document.querySelectorAll(".page .traits.c20-v2 .trait .display").forEach((x) => {
      createDescription(x);
    });

    // Populate markdown for initial nodes
    document.querySelectorAll(".page .traits.c20-v2 .repcontainer .trait").forEach((x) => {
      updateDescription(x);
    });

    traitsContainer.addEventListener("change", checkForUpdates);
    serverChangeHandler();
  }

  function checkForUpdates(event) {
    if (event.target.getAttribute("name") === "attr_description") {
      const traitContainer = event.target.closest(".trait");
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

    const inputEl = container.querySelector('.options [name="attr_description"]');
    if (!inputEl) return;

    const displayContainer = container.querySelector(".display");
    if (!displayContainer) return;

    let descSpan = displayContainer.querySelector(".c20-desc");
    if (!descSpan) {
      descSpan = createDescription(displayContainer);
    }

    if (observer) observer.disconnect();

    const markdownNode = createMarkdownDisplay(inputEl.value);
    descSpan.replaceChildren(markdownNode);

    const targetNode = document.querySelector(".page .traits.c20-v2");
    if (observer && targetNode) observer.observe(targetNode, config);
  }

  function serverChangeHandler() {
    observer = new MutationObserver(async (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.target.classList.contains("repcontainer")) {
          const firstAddedNode = mutation.addedNodes?.[0];
          if (firstAddedNode && firstAddedNode.nodeType === 1 && firstAddedNode.classList.contains("repitem")) {
            const traitNode = firstAddedNode.querySelector(".trait");
            if (traitNode) updateDescription(traitNode);
          }
        }
      }
    });

    const targetNode = document.querySelector(".page .traits.c20-v2");
    if (targetNode) observer.observe(targetNode, config);
  }

  var Traits = {
    init: function init() {
      createUi();
    },
    remove: function remove() {
      const selector = document.querySelector(".page .traits.c20-v2");
      if (!selector) return;

      selector.querySelectorAll(".c20-desc").forEach((x) => x.remove());
      selector.removeEventListener("change", checkForUpdates);
      selector.classList.remove("c20-v2");

      if (observer) observer.disconnect();
    },
  };
  return Traits;
})();
