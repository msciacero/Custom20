var Traits = (function () {
  var observer;

  function createUi() {
    document.querySelector(".page .traits").classList.add("c20-v2");

    document.querySelectorAll(".page .traits.c20-v2 .trait .display").forEach((x) => {
      createDescription(x);
    });

    document.querySelectorAll(".page .traits.c20-v2 .repcontainer .trait").forEach((x) => {
      updateDescription(x);
    });

    document.querySelector(".page .traits.c20-v2").addEventListener("change", checkForUpdates);
    serverChangeHandler();
  }

  function checkForUpdates(event) {
    if (event.target.getAttribute("name") === "attr_description") updateDescription(event.target.closest(".trait"));
  }

  function createDescription(container) {
    var span = document.createElement("span");
    span.className = "c20-desc";
    container.appendChild(span);
  }

  function updateDescription(container) {
    var value = container.querySelector('.options [name="attr_description"]').value;
    container.querySelector(".display .c20-desc").replaceChildren(createMarkdownDisplay(value));
  }

  function serverChangeHandler() {
    observer = new MutationObserver(async (mutationsList, _) => {
      for (const mutation of mutationsList) {
        if (mutation.target.classList.contains("repcontainer")) {
          if (mutation.addedNodes?.[0]?.classList.contains("repitem"))
            updateDescription(mutation.addedNodes[0].querySelector(".trait"));
        }
      }
    });

    const targetNode = document.querySelector(".page .traits.c20-v2"); // Or any other DOM element
    const config = {
      childList: true, // Observe additions/removals of child nodes
      subtree: true, // Observe changes in descendants of the target node
    };

    observer.observe(targetNode, config);
  }

  var Traits = {
    init: function init() {
      createUi();
    },
    remove: function remove() {
      var selector = document.querySelectorAll(".page .traits.c20-v2");
      selector.querySelector(".c20-desc").remove();
      selector.removeEventListener("change", checkForUpdates);
      selector.classList.remove("c20-v2");
      observer.disconnect();
    },
  };
  return Traits;
})();
