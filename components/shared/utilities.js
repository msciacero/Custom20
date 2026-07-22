function waitForElement(selector, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const immediateElement = document.querySelector(selector);
    if (immediateElement) return resolve(immediateElement);

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(timeoutId);
        observer.disconnect(); // Stop watching the DOM
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error("C20 rolled a natural 1: Page timeout"));
    }, timeoutMs);
  });
}
