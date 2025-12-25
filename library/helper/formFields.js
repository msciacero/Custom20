function createSelectInput(data) {
  var group = document.createElement("div");

  var label = document.createElement("label");
  label.setAttribute("for", data.name);
  label.textContent = data.title;

  var select = document.createElement("select");
  select.id = data.name;
  select.name = data.name;
  select.required = data.required || false;

  // default option
  var option = document.createElement("option");
  option.value = "";
  option.textContent = "-- Select --";
  option.style.fontStyle = "italic";
  if (data.value === option.value) option.selected = true;
  select.appendChild(option);

  data.options.forEach((o) => {
    var option = document.createElement("option");
    option.value = o.value;
    option.textContent = o.name;
    if (data.value === o.value) option.selected = true;
    select.appendChild(option);
  });

  group.appendChild(label);
  group.appendChild(select);

  return group;
}

function createRadioInput({ title, id, name, checked, changeHandler }) {
  var group = document.createElement("div");
  group.style.display = "flex";

  var input = document.createElement("input");
  input.type = "radio";
  input.id = id;
  input.name = name;
  input.value = id;
  input.checked = checked;
  if (changeHandler !== undefined) input.addEventListener("change", changeHandler);

  var label = createLabel(id, title);
  label.style.padding = "5px 0 0 5px";

  group.appendChild(input);
  group.appendChild(label);
  return group;
}

function createTextInput({ title, name, value, required }) {
  var group = document.createElement("div");
  group.style.marginBottom = "10px";

  var input = createInput(name, value, required);
  input.style.width = "91%";

  group.appendChild(createLabel(name, title));
  group.appendChild(input);
  return group;
}

function createTextAreaInput({ title, name, value, required }) {
  var group = document.createElement("div");
  group.style.marginBottom = "10px";
  group.appendChild(createLabel(name, title));
  group.appendChild(createTextArea(name, value, required));
  return group;
}

function createCheckboxInput({ title, name, value }) {
  var group = document.createElement("div");

  var input = document.createElement("input");
  input.type = "checkbox";
  input.name = name;
  input.id = name;
  input.checked = value;
  input.style.marginLeft = "0px";
  input.style.marginRight = "5px";

  var label = createLabel(name, title);
  label.style.padding = "5px 0 0 0px";
  label.style.display = "inline-block";

  group.appendChild(input);
  group.appendChild(label);
  return group;
}

function createHiddenInput({ name, value }) {
  var input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;

  return input;
}

// Text Array Inputs
function createTextArray({ title, name, values, required }) {
  var group = document.createElement("div");
  group.style.marginBottom = "20px";

  var label = document.createElement("label");
  label.textContent = title;
  group.appendChild(label);

  values.forEach((v, _) => {
    group.appendChild(createTextArrayInput(name, v, required));
  });

  var addBtn = createAddButton();
  addBtn.addEventListener("click", function (event) {
    event.preventDefault();
    addBtn.before(createTextArrayInput(name, "", required));
  });

  group.appendChild(addBtn);

  return group;
}

function createTextArrayInput(name, value, required) {
  var inputGroup = document.createElement("div");

  var input = createInput(name, value, required);
  input.style.width = "91%";
  input.style.marginBottom = "5px";
  inputGroup.appendChild(input);

  var btn = createDeleteButton();
  btn.addEventListener("click", function () {
    inputGroup.remove();
    enableSaveButton();
  });

  inputGroup.appendChild(btn);
  return inputGroup;
}

// Text Area Array Inputs
function createTextAreaArray({ title, name, values, required }) {
  var group = document.createElement("div");
  group.style.marginBottom = "20px";

  var label = document.createElement("label");
  label.textContent = title;
  group.appendChild(label);

  values.forEach((v) => {
    group.appendChild(createTextAreaArrayInput(name, v, required));
  });

  var addBtn = createAddButton();
  addBtn.addEventListener("click", function (event) {
    event.preventDefault();
    addBtn.before(createTextAreaArrayInput(name, "", required));
  });

  group.appendChild(addBtn);

  return group;
}

function createTextAreaArrayInput(name, value, required) {
  var inputGroup = document.createElement("div");

  var input = createTextArea(name, value, required);
  input.style.marginBottom = "5px";
  input.style.height = "50px";
  inputGroup.appendChild(input);

  var btn = createDeleteButton();
  btn.addEventListener("click", function () {
    inputGroup.remove();
    enableSaveButton();
  });

  inputGroup.appendChild(btn);
  return inputGroup;
}

class c20FieldSelect {
  selectEl = null;

  create({ title, name, value, options, required, changeHandler }) {
    var group = document.createElement("div");
    group.appendChild(createLabel(name, title));

    this.selectEl = document.createElement("select");
    this.selectEl.id = name;
    this.selectEl.name = name;
    this.selectEl.required = required || false;
    this.#setOptions(options, value);
    if (changeHandler) this.selectEl.addEventListener("change", changeHandler);

    group.appendChild(this.selectEl);
    return group;
  }

  getValue() {
    return this.selectEl.value;
  }

  updateOptions(options) {
    this.selectEl.value = "";
    this.#setOptions(options, "");
  }

  reset() {
    this.selectEl.value = "";
  }

  disabled(value) {
    this.selectEl.disabled = value;
  }

  #setOptions(options, value) {
    this.selectEl.replaceChildren();

    // default option
    var option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Select --";
    option.style.fontStyle = "italic";
    if (value === option.value) option.selected = true;
    this.selectEl.appendChild(option);

    options.forEach((o) => {
      var option = document.createElement("option");
      option.value = o.value;
      option.textContent = o.name;
      if (value === o.value) option.selected = true;
      this.selectEl.appendChild(option);
    });
  }
}

class c20FieldComboBox {
  inputEl = null;
  optionsEl = null;
  addMissing = false;

  create({ title, name, options, changeHandler }) {
    var group = document.createElement("div");
    group.className = "c20-combobox";
    group.appendChild(createLabel(name, title));

    var wrapper = document.createElement("span");
    this.inputEl = createInput(name, "", false, "-- Select --");
    this.optionsEl = this.#createDivOptions(options);

    this.optionsEl.addEventListener("mousedown", (event) => {
      var value = event.target.getAttribute("data-c20-value");
      this.inputEl.value = event.target.textContent;
      this.inputEl.setAttribute("data-c20-value", value);
    });

    this.inputEl.addEventListener("input", (event) => {
      var value = event.target.value.toLowerCase();
      var hasChoice = false;
      var hasMatch = false;
      this.optionsEl.childNodes.forEach((o) => {
        if (!o.classList.contains("c20-noResults") && o.textContent.toLowerCase().includes(value)) {
          if (o.textContent.toLowerCase() === value) hasMatch = true;
          o.classList.remove("hidden");
          hasChoice = true;
        } else o.classList.add("hidden");
      });

      var newResultOption = this.optionsEl.querySelector(".c20-newResults");
      if (this.addMissing && !hasMatch) {
        newResultOption.textContent = `Add ${event.target.value}...`;
        newResultOption.classList.remove("hidden");
      } else {
        newResultOption.classList.add("hidden");
        var noResultOption = this.optionsEl.querySelector(".c20-noResults");
        if (!hasChoice) noResultOption.classList.remove("hidden");
        else noResultOption.classList.add("hidden");
      }
    });

    this.inputEl.addEventListener("blur", (_) => {
      this.optionsEl.querySelectorAll(".hidden")?.forEach((x) => x?.classList?.remove("hidden"));
      if (this.optionsEl.childElementCount > 1) this.optionsEl.querySelector(".c20-noResults").classList.add("hidden");
      this.optionsEl.querySelector(".active")?.classList?.remove("active");
      var option = Array.from(this.optionsEl.childNodes).find((o) => o.textContent === this.inputEl.value);
      var value = option?.getAttribute("data-c20-value") ?? "";

      if (!this.addMissing) this.optionsEl.querySelector(".c20-newResults").classList.add("hidden");
      else this.optionsEl.querySelector(".c20-newResults").textContent = "Add...";

      if (option) {
        this.inputEl.setAttribute("data-c20-value", value);
        this.optionsEl.querySelector(`[data-c20-value="${value}"]`).classList.add("active");
      } else {
        this.inputEl.value = value;
        this.inputEl.setAttribute("data-c20-value", value);
      }
      changeHandler(value);
    });

    wrapper.append(this.inputEl);
    group.appendChild(wrapper);
    group.appendChild(this.optionsEl);
    return group;
  }

  getValue() {
    return this.inputEl.getAttribute("data-c20-value");
  }

  getTextValue() {
    return this.inputEl.value;
  }

  updateOptions(options) {
    var el = this.#createDivOptions(options);
    this.optionsEl.replaceChildren(...el.childNodes);
  }

  disabled(value) {
    this.inputEl.disabled = value;
  }

  reset() {
    this.inputEl.value = "";
    this.inputEl.setAttribute("data-c20-value", "");
  }

  allowNewEntries(value) {
    this.addMissing = value;
    if (value) this.optionsEl?.querySelector(".c20-newResults")?.classList?.remove("hidden");
    else this.optionsEl?.querySelector(".c20-newResults")?.classList?.add("hidden");
  }

  #createDivOptions(options) {
    var optionsEl = document.createElement("div");

    var newResultOption = document.createElement("div");
    newResultOption.className = "c20-newResults";
    if (!this.addMissing) newResultOption.classList.add("hidden");
    newResultOption.setAttribute("data-c20-value", -1);
    newResultOption.textContent = "Add...";
    optionsEl.appendChild(newResultOption);

    options.forEach((o) => {
      var option = document.createElement("div");
      option.setAttribute("data-c20-value", o.value);
      option.textContent = o.text;
      optionsEl.appendChild(option);
    });

    var noResultOption = document.createElement("div");
    noResultOption.textContent = "No results found";
    noResultOption.className = "c20-noResults";
    if (optionsEl.childElementCount !== 0) noResultOption.classList.add("hidden");
    optionsEl.appendChild(noResultOption);

    return optionsEl;
  }
}

// helpers
function createLabel(id, title) {
  var label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = title;
  return label;
}

function createInput(name, value, required, placeHolder) {
  var input = document.createElement("input");
  input.type = "text";
  input.id = name;
  input.name = name;
  input.placeholder = placeHolder ?? "";
  input.required = required ?? false;
  input.value = value ?? "";
  input.autocomplete = "off";
  return input;
}

function createTextArea(name, value, required) {
  var input = document.createElement("textarea");
  input.name = name;
  input.required = required ?? false;
  input.value = value ?? "";
  input.style.width = "91%";
  input.style.height = "100px";
  return input;
}

function createAddButton() {
  var addBtn = document.createElement("button");
  addBtn.textContent = "Add +";
  addBtn.className = "btn";
  return addBtn;
}

function createDeleteButton() {
  var btn = document.createElement("button");
  btn.textContent = "#";
  btn.className = "btn";
  btn.style.fontFamily = "pictos";
  btn.style.marginLeft = "9px";
  btn.style.verticalAlign = "top";
  return btn;
}
