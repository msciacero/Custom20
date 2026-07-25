var MarkerMenu = (function () {
  let observer = null;

  // Cache the core observer configuration parameters locally
  const config = { childList: true, subtree: true };

  function overrideUi(menu) {
    if (!menu) return;

    const newChildren = [];
    const gridChildren = [];

    const gridContainer = document.createElement("div");
    gridContainer.style.display = "grid";
    gridContainer.style.setProperty("grid-template-columns", "1fr 1fr");

    // Process nodes safely
    menu.childNodes.forEach((child) => {
      // Ensure we are interacting with an actual element node (nodeType 1)
      if (child.nodeType !== 1) return;

      if (child.id === "tokenMarkerTopBar" || child.classList.contains("markercolor")) {
        newChildren.push(child);
      } else {
        // Enforce fallback default value configurations to avoid string crashes
        const itemTitle = child.title || "Status Marker";
        child.textContent = itemTitle;
        child.style.padding = "0 0 22px 30px";
        child.style.width = "100%";
        child.style.overflow = "hidden";
        child.style.setProperty("white-space", "nowrap");
        child.style.setProperty("box-sizing", "border-box");
        child.style.setProperty("text-overflow", "ellipsis");
        gridChildren.push(child);
      }
    });

    // Sort items alphabetically safely using localeCompare
    gridChildren.sort((a, b) => {
      const titleA = a.title || "";
      const titleB = b.title || "";
      return titleA.localeCompare(titleB);
    });

    gridChildren.forEach((item) => gridContainer.appendChild(item));
    newChildren.push(gridContainer);

    // SAFEGUARD: Temporarily pause the observer to prevent an infinite mutation rendering loop crash
    if (observer) observer.disconnect();

    menu.replaceChildren(...newChildren);

    // RECONNECT: Put the observer back to work tracking live game additions
    const targetNode = document.querySelector("#vm-tabletop-ui-layer");
    if (observer && targetNode) {
      observer.observe(targetNode, config);
    }
  }

  function serverChangeHandler() {
    observer = new MutationObserver(async (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes) {
          const targetMenuNode = Array.from(mutation.addedNodes).find(
            (node) => node.nodeType === 1 && node.classList.contains("markermenu"),
          );

          if (targetMenuNode) {
            overrideUi(targetMenuNode);
          }
        }
      }
    });

    const targetNode = document.querySelector("#vm-tabletop-ui-layer");
    if (targetNode) {
      observer.observe(targetNode, config);
    } else {
      console.warn("[C20] Aborting marker manager hook: '#vm-tabletop-ui-layer' missing from VTT frame.");
    }
  }

  const MarkerMenu = {
    init: serverChangeHandler,
    remove: function () {
      if (observer) {
        observer.disconnect();
      }
    },
  };

  return MarkerMenu;
})();
