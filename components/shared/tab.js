function createTabContainer(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return document.createElement("div");
  }

  const tabContainer = document.createElement("div");
  tabContainer.className = "c20-tab-container";

  const tabButtons = document.createElement("div");
  tabButtons.className = "c20-tab-buttons";

  const tabContent = document.createElement("div");
  tabContent.className = "c20-tab-content";

  // FIXED: Converted to a clean index for-loop to eliminate heavy closure memory references
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item) continue;

    const button = document.createElement("button");
    button.className = "c20-tab-button";
    button.textContent = item.name || `Tab ${i + 1}`;
    button.setAttribute("data-tab-index", i); // Store index safely as an attribute reference

    if (i === 0) {
      button.classList.add("active");
    }

    const panel = document.createElement("div");
    panel.className = "c20-tab-panel";
    panel.setAttribute("data-tab-index", i); // Match index structurally

    if (i === 0) {
      panel.classList.add("active");
    }

    if (item.data instanceof Node) {
      panel.appendChild(item.data);
    }

    // FIXED: Upgraded click handler to safely navigate the DOM tree relative to the clicked button
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const clickedBtn = event.currentTarget;
      const targetIndex = clickedBtn.getAttribute("data-tab-index");

      // Navigate strictly within THIS specific tab container instance boundary
      const rootContainer = clickedBtn.closest(".c20-tab-container");
      if (!rootContainer) return;

      // Cleanly clear active buttons within this instance scope alone
      rootContainer.querySelectorAll(".c20-tab-buttons .c20-tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });

      // Cleanly clear active panels within this instance scope alone
      rootContainer.querySelectorAll(".c20-tab-content .c20-tab-panel").forEach((pnl) => {
        pnl.classList.remove("active");
      });

      // Activate the targeted elements smoothly
      clickedBtn.classList.add("active");

      const targetPanel = rootContainer.querySelector(
        `.c20-tab-content .c20-tab-panel[data-tab-index="${targetIndex}"]`,
      );
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });

    tabButtons.appendChild(button);
    tabContent.appendChild(panel);
  }

  tabContainer.appendChild(tabButtons);
  tabContainer.appendChild(tabContent);

  return tabContainer;
}
