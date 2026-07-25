function createSelectInput(data) {
  if (!data) return document.createElement("div");

  const group = document.createElement("div");
  const uniqueId = `c20-select-${data.name}-${Math.floor(Math.random() * 100000)}`;

  const label = document.createElement("label");
  label.setAttribute("for", uniqueId);
  label.textContent = data.title;

  const select = document.createElement("select");
  select.id = uniqueId;
  select.name = data.name;
  select.required = !!data.required;
  select.style.width = "100%";

  // FIXED: Enforced strict nullish fallback evaluations to protect selection tracks
  const currentActiveValue = data.value ?? "";

  // default option setup
  const option = document.createElement("option");
  option.value = "";
  option.textContent = "-- Select --";
  option.style.fontStyle = "italic";
  if (currentActiveValue === "") option.selected = true;
  select.appendChild(option);

  if (Array.isArray(data.options)) {
    data.options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.name;
      if (currentActiveValue === String(o.value)) opt.selected = true;
      select.appendChild(opt);
    });
  }

  group.appendChild(label);
  group.appendChild(select);
  return group;
}

function createRadioInputGroup({ title, name, options, selectedValue, changeHandler, inline }) {
  const group = document.createElement("div");
  if (title) group.appendChild(createLabel(name, title));

  const optionGroup = document.createElement("div");
  optionGroup.style.display = inline ? "flex" : "block";
  optionGroup.style.gap = inline ? "10px" : "0px";

  if (Array.isArray(options)) {
    options.forEach((o) => {
      const radioInput = createRadioInput({
        title: o.name,
        id: o.value,
        name: name,
        checked: selectedValue === o.value,
        changeHandler: changeHandler,
      });
      optionGroup.appendChild(radioInput);
    });
  }

  group.appendChild(optionGroup);
  return group;
}

function createRadioInput({ title, id, name, checked, changeHandler }) {
  const group = document.createElement("div");
  group.style.display = "flex";

  const input = document.createElement("input");
  input.type = "radio";
  input.value = id;

  // FIXED: Enforced unique ID strings per row to eliminate labels cross-firing bugs
  const uniqueRadioId = `c20-radio-${name}-${id}-${Math.floor(Math.random() * 100000)}`;
  input.id = uniqueRadioId;
  input.name = name;
  input.checked = !!checked;

  if (typeof changeHandler === "function") {
    input.addEventListener("change", changeHandler);
  }

  const label = createLabel(uniqueRadioId, title);
  label.style.padding = "5px 0 0 5px";

  group.appendChild(input);
  group.appendChild(label);
  return group;
}

function createTextInput({ title, name, value, required, placeHolder }) {
  const group = document.createElement("div");
  group.style.marginBottom = "10px";

  const input = createInput(name, value, required, placeHolder);
  if (input) input.style.width = "100%";

  group.appendChild(createLabel(name, title));
  if (input) group.appendChild(input);
  return group;
}

function createTextAreaInput({ title, name, value, required, height }) {
  const group = document.createElement("div");
  group.style.marginBottom = "10px";
  group.appendChild(createLabel(name, title));

  const textArea = createTextArea(name, value, required, height);
  if (textArea) group.appendChild(textArea);
  return group;
}

function createCheckboxInput({ title, name, value }) {
  const group = document.createElement("div");
  const uniqueCheckboxId = `c20-checkbox-${name}-${Math.floor(Math.random() * 100000)}`;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.id = uniqueCheckboxId; // FIXED: Protected IDs from duplication layout overlap issues
  input.checked = !!value;
  input.style.marginLeft = "0px";
  input.style.marginRight = "5px";

  const label = createLabel(uniqueCheckboxId, title);
  label.style.padding = "5px 0 0 0px";
  label.style.display = "inline-block";

  group.appendChild(input);
  group.appendChild(label);
  return group;
}

function createHiddenInput({ name, value }) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value ?? "";
  return input;
}

// Text Array Inputs
function createTextArray({ title, name, values, required }) {
  const group = document.createElement("div");
  group.style.marginBottom = "20px";

  const label = document.createElement("label");
  label.textContent = title;
  group.appendChild(label);

  const initialValues = Array.isArray(values) ? values : [];
  initialValues.forEach((v) => {
    group.appendChild(createTextArrayInput(name, v, required));
  });

  const addBtn = createAddButton();
  if (addBtn) {
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      addBtn.before(createTextArrayInput(name, "", required));
    });
    group.appendChild(addBtn);
  }

  return group;
}

// FIXED: Cleaned up listener reference loops to eliminate hidden memory leakage traps
function handleFormArrayItemDelete(event) {
  event.preventDefault();
  const deleteBtn = event.currentTarget;
  const parentRowContainer = deleteBtn.parentElement;
  if (parentRowContainer) {
    parentRowContainer.remove();
  }
}

function createTextArrayInput(name, value, required) {
  const inputGroup = document.createElement("div");

  const input = createInput(name, value, required);
  if (input) {
    input.style.width = "91%";
    input.style.marginBottom = "5px";
    inputGroup.appendChild(input);
  }

  const btn = createDeleteButton();
  if (btn) {
    // SUCCESS: Replaced closed functional leaks with safe relative event traversals
    btn.addEventListener("click", handleFormArrayItemDelete);
    inputGroup.appendChild(btn);
  }

  return inputGroup;
}

// Text Area Array Inputs
function createTextAreaArray({ title, name, values, required }) {
  const group = document.createElement("div");
  group.style.marginBottom = "20px";

  const label = document.createElement("label");
  label.textContent = title;
  group.appendChild(label);

  const initialValues = Array.isArray(values) ? values : [];
  initialValues.forEach((v) => {
    group.appendChild(createTextAreaArrayInput(name, v, required));
  });

  const addBtn = createAddButton();
  if (addBtn) {
    addBtn.addEventListener("click", function (event) {
      event.preventDefault();
      addBtn.before(createTextAreaArrayInput(name, "", required));
    });
    group.appendChild(addBtn);
  }

  return group;
}

function createTextAreaArrayInput(name, value, required) {
  const inputGroup = document.createElement("div");

  const input = createTextArea(name, value, required, null);
  if (input) {
    input.style.marginBottom = "5px";
    input.style.height = "50px";
    inputGroup.appendChild(input);
  }

  const btn = createDeleteButton();
  if (btn) {
    btn.addEventListener("click", handleFormArrayItemDelete);
    inputGroup.appendChild(btn);
  }

  return inputGroup;
}

class c20FieldSelect {
  // Modern ES6 explicit public field property declarations
  selectEl = null;

  create({ title, name, value, options, required, changeHandler }) {
    const group = document.createElement("div");
    if (typeof createLabel === "function") {
      group.appendChild(createLabel(name, title));
    }

    const uniqueSelectId = `c20-select-${name}-${Math.floor(Math.random() * 100000)}`;

    this.selectEl = document.createElement("select");
    this.selectEl.id = uniqueSelectId;
    this.selectEl.name = name;
    this.selectEl.required = !!required;
    this.selectEl.style.width = "100%";

    this.#setOptions(options, value);

    if (typeof changeHandler === "function") {
      this.selectEl.addEventListener("change", changeHandler);
    }

    group.appendChild(this.selectEl);
    return group;
  }

  getValue() {
    return this.selectEl ? this.selectEl.value : "";
  }

  updateOptions(options) {
    if (!this.selectEl) return;
    this.selectEl.value = "";
    this.#setOptions(options, "");
  }

  reset() {
    if (this.selectEl) this.selectEl.value = "";
  }

  disabled(value) {
    if (this.selectEl) this.selectEl.disabled = !!value;
  }

  #setOptions(options, value) {
    if (!this.selectEl) return;
    this.selectEl.replaceChildren();

    const currentTargetValue = value ?? "";

    // default selection row option setup
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Select --";
    option.style.fontStyle = "italic";
    if (currentTargetValue === "") option.selected = true;
    this.selectEl.appendChild(option);

    const safeOptions = Array.isArray(options) ? options : [];
    safeOptions.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.text;
      if (String(currentTargetValue) === String(o.value)) opt.selected = true;
      this.selectEl.appendChild(opt);
    });
  }
}

class c20FieldComboBox {
  inputEl = null;
  optionsEl = null;
  addMissing = false;
  #isClickingOption = false;

  create({ title, name, options, changeHandler }) {
    const group = document.createElement("div");
    group.className = "c20-combobox";

    if (typeof createLabel === "function") {
      group.appendChild(createLabel(name, title));
    }

    const wrapper = document.createElement("span");
    const uniqueComboId = `c20-combo-${name}-${Math.floor(Math.random() * 100000)}`;

    if (typeof createInput === "function") {
      this.inputEl = createInput(uniqueComboId, "", false, "-- Select --");
    } else {
      this.inputEl = document.createElement("input");
      this.inputEl.id = uniqueComboId;
      this.inputEl.placeholder = "-- Select --";
    }

    this.inputEl.name = name;
    this.optionsEl = this.#createDivOptions(options);

    // FIXED: Fire the changeHandler immediately inside mousedown when an item is selected!
    this.optionsEl.addEventListener("mousedown", (event) => {
      this.#isClickingOption = true;

      const targetDiv = event.target.closest("[data-c20-value]");
      if (!targetDiv) return;

      const value = targetDiv.getAttribute("data-c20-value");
      this.inputEl.value = targetDiv.textContent;
      this.inputEl.setAttribute("data-c20-value", value);

      // SUCCESS: Fire the handler right here so the editor updates instantly on item selection!
      if (typeof changeHandler === "function") {
        changeHandler(value);
      }
    });

    this.inputEl.addEventListener("input", (event) => {
      const value = event.target.value.toLowerCase();
      let hasChoice = false;
      let hasMatch = false;

      this.optionsEl.childNodes.forEach((o) => {
        if (o.nodeType !== 1) return;

        if (!o.classList.contains("c20-noResults") && o.textContent.toLowerCase().includes(value)) {
          if (o.textContent.toLowerCase() === value) hasMatch = true;
          o.classList.remove("hidden");
          hasChoice = true;
        } else {
          o.classList.add("hidden");
        }
      });

      const newResultOption = this.optionsEl.querySelector(".c20-newResults");
      const noResultOption = this.optionsEl.querySelector(".c20-noResults");

      if (this.addMissing && !hasMatch) {
        if (newResultOption) {
          newResultOption.textContent = `Add ${event.target.value}...`;
          newResultOption.classList.remove("hidden");
        }
      } else {
        newResultOption?.classList.add("hidden");
        if (!hasChoice) {
          noResultOption?.classList.remove("hidden");
        } else {
          noResultOption?.classList.add("hidden");
        }
      }
    });

    this.inputEl.addEventListener("blur", () => {
      // Defer evaluation if user clicked an option, because mousedown handles it perfectly now!
      if (this.#isClickingOption) {
        this.#isClickingOption = false;
        return;
      }

      this.optionsEl.querySelectorAll(".hidden").forEach((x) => x?.classList?.remove("hidden"));

      const noResultOption = this.optionsEl.querySelector(".c20-noResults");
      if (this.optionsEl.childElementCount > 1 && noResultOption) {
        noResultOption.classList.add("hidden");
      }

      this.optionsEl.querySelector(".active")?.classList?.remove("active");

      const currentInputValue = this.inputEl.value;
      const currentAttrValue = this.inputEl.getAttribute("data-c20-value");

      let option = Array.from(this.optionsEl.childNodes).find(
        (o) =>
          o.nodeType === 1 &&
          o.textContent === currentInputValue &&
          o.getAttribute("data-c20-value") === currentAttrValue,
      );

      if (!option) {
        option = Array.from(this.optionsEl.childNodes).find(
          (o) => o.nodeType === 1 && o.textContent === currentInputValue,
        );
      }

      const value = option?.getAttribute("data-c20-value") ?? "";
      const newResultOption = this.optionsEl.querySelector(".c20-newResults");

      if (!this.addMissing) {
        newResultOption?.classList.add("hidden");
      } else if (newResultOption) {
        newResultOption.textContent = "Add...";
      }

      if (option) {
        this.inputEl.setAttribute("data-c20-value", value);
        this.optionsEl.querySelector(`[data-c20-value="${value}"]`)?.classList.add("active");
      } else {
        this.inputEl.value = value;
        this.inputEl.setAttribute("data-c20-value", value);
      }

      // Keep this for when the user clicks away or presses Enter without selecting a specific dropdown list item
      if (typeof changeHandler === "function") {
        changeHandler(value);
      }
    });

    wrapper.appendChild(this.inputEl);
    group.appendChild(wrapper);
    group.appendChild(this.optionsEl);
    return group;
  }

  getValue() {
    return this.inputEl ? this.inputEl.getAttribute("data-c20-value") : "";
  }

  getTextValue() {
    return this.inputEl ? this.inputEl.value : "";
  }

  setValue(value) {
    if (!this.optionsEl || !this.inputEl) return;

    const selected = this.optionsEl.querySelector(`[data-c20-value="${value}"]`);
    if (selected) {
      selected.classList.add("active");
      this.inputEl.value = selected.textContent;
      this.inputEl.setAttribute("data-c20-value", value);
    }
  }

  updateOptions(options) {
    if (!this.optionsEl) return;
    const el = this.#createDivOptions(options);
    this.optionsEl.replaceChildren(...Array.from(el.childNodes));
  }

  disabled(value) {
    if (this.inputEl) this.inputEl.disabled = !!value;
  }

  reset() {
    if (this.inputEl) {
      this.inputEl.value = "";
      this.inputEl.setAttribute("data-c20-value", "");
    }
  }

  allowNewEntries(value) {
    this.addMissing = !!value;
    const newResultOption = this.optionsEl?.querySelector(".c20-newResults");

    if (value) {
      newResultOption?.classList?.remove("hidden");
    } else {
      newResultOption?.classList?.add("hidden");
    }
  }

  #createDivOptions(options) {
    const optionsEl = document.createElement("div");

    const newResultOption = document.createElement("div");
    newResultOption.className = "c20-newResults";
    if (!this.addMissing) {
      newResultOption.classList.add("hidden");
    }
    newResultOption.setAttribute("data-c20-value", "-1");
    newResultOption.textContent = "Add...";
    optionsEl.appendChild(newResultOption);

    const safeOptions = Array.isArray(options) ? options : [];
    safeOptions.forEach((o) => {
      const option = document.createElement("div");
      option.setAttribute("data-c20-value", o.value);
      option.textContent = o.text;
      optionsEl.appendChild(option);
    });

    const noResultOption = document.createElement("div");
    noResultOption.textContent = "No results found";
    noResultOption.className = "c20-noResults";
    if (optionsEl.childElementCount !== 1) {
      noResultOption.classList.add("hidden");
    }
    optionsEl.appendChild(noResultOption);

    return optionsEl;
  }
}

// FIXED: Swapped traditional internal logic checks out for modern ECMAScript default parameters
function createLabel(id = "", title = "") {
  const label = document.createElement("label");
  if (id) {
    label.setAttribute("for", id);
  }
  label.textContent = title;
  return label;
}

// FIXED: Removed the hardcoded id = name assignment to prevent repeating array grids from crashing label focus
function createInput(name = "", value = "", required = false, placeHolder = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.placeholder = placeHolder;
  input.required = !!required; // Enforce strict type coercion safety bounds
  input.value = value;
  input.autocomplete = "off";
  return input;
}

function createTextArea(name = "", value = "", required = false, height = null) {
  const input = document.createElement("textarea");
  input.name = name;
  input.required = !!required;
  input.value = value;
  input.style.width = "100%";

  // Clean fallback height calculations mapping string parameters cleanly
  input.style.height = height ? `${height}px` : "100px";
  return input;
}

function createAddButton() {
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add +";
  addBtn.className = "btn";
  return addBtn;
}

function createDeleteButton() {
  const btn = document.createElement("button");
  btn.textContent = "#";
  btn.className = "btn";
  btn.style.fontFamily = "pictos";
  btn.style.marginLeft = "9px";
  btn.style.verticalAlign = "top";
  return btn;
}
