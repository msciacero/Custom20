//markermenu open
var MarkerMenu = (function () {
  var observer = null;

  function overrideUi(menu) {
    var newChildren = [];
    var gridChildren = [];

    var gridContainer = document.createElement("div");
    gridContainer.style.display = "grid";
    gridContainer.style.setProperty("grid-template-columns", "1fr 1fr");

    menu.childNodes.forEach((child) => {
      if (child.id === "tokenMarkerTopBar" || child.classList.contains("markercolor")) {
        newChildren.push(child);
      } else {
        child.textContent = child.title;
        child.style.padding = "0 0 22px 30px";
        child.style.width = "100%";
        child.style.overflow = "hidden";
        child.style.setProperty("white-space", "nowrap");
        child.style.setProperty("box-sizing", "border-box");
        child.style.setProperty("text-overflow", "ellipsis");
        gridChildren.push(child);
      }
    });

    gridChildren.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });

    gridChildren.forEach((item) => gridContainer.appendChild(item));
    newChildren.push(gridContainer);
    menu.replaceChildren(...newChildren);
  }

  function serverChangeHandler() {
    observer = new MutationObserver(async (mutationsList, _) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes?.[0]?.className === "markermenu") {
          overrideUi(mutation.addedNodes[0]);
        }
      }
    });

    const targetNode = document.querySelector("#vm-tabletop-ui-layer"); // Or any other DOM element
    const config = {
      childList: true, // Observe additions/removals of child nodes
      subtree: true, // Observe changes in descendants of the target node
    };

    observer.observe(targetNode, config);
  }

  var MarkerMenu = {
    init: serverChangeHandler,
    remove: function () {
      observer.disconnect();
    },
  };
  return MarkerMenu;
})();
