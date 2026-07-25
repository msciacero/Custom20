function createClassEditor(data) {
  if (!data) return document.createElement("form");

  const editor = document.createElement("form");
  editor.className = "c20-form";
  editor.style.cssText = "margin: 20px 0 30px 0;";

  if (typeof createTextInput === "function") {
    editor.appendChild(createTextInput({ name: "name", title: "Feature", value: data.name || "", required: true }));
    editor.appendChild(
      createTextInput({ name: "groupName", title: "Class", value: data.groupName ?? "", required: true }),
    );
    editor.appendChild(createTextInput({ name: "level", title: "Level", value: data.level || "", required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source || "", required: false }));
  }

  if (typeof createTextAreaInput === "function") {
    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description || "",
        required: false,
        height: 320,
      }),
    );
  }

  if (typeof createHiddenInput === "function") {
    editor.appendChild(createHiddenInput({ name: "type", value: data.type || "class" }));

    // FIXED: Upgraded type safety validations to prevent null identifiers from generating duplicate zombie records
    if (data.id !== undefined && data.id !== null && data.id !== "") {
      editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    }
  }

  return editor;
}

function createSubclassEditor(data) {
  if (!data) return document.createElement("form");

  const editor = document.createElement("form");
  editor.className = "c20-form";
  editor.style.cssText = "margin: 20px 0 30px 0;";

  if (typeof createTextInput === "function") {
    editor.appendChild(createTextInput({ name: "name", title: "Feature", value: data.name || "", required: true }));
    editor.appendChild(
      createTextInput({ name: "className", title: "Class", value: data.className ?? "", required: true }),
    );
    editor.appendChild(
      createTextInput({ name: "subclassName", title: "Subclass", value: data.subclassName ?? "", required: true }),
    );
    editor.appendChild(createTextInput({ name: "level", title: "Level", value: data.level || "", required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source || "", required: false }));
  }

  if (typeof createTextAreaInput === "function") {
    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description || "",
        required: false,
        height: 320,
      }),
    );
  }

  if (typeof createHiddenInput === "function") {
    editor.appendChild(createHiddenInput({ name: "type", value: data.type || "subclass" }));

    // FIXED: Upgraded type safety validations to prevent null identifiers from generating duplicate zombie records
    if (data.id !== undefined && data.id !== null && data.id !== "") {
      editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    }
  }

  return editor;
}
