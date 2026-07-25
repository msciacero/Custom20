function createTraitEditor(data) {
  if (!data) return document.createElement("form");

  const editor = document.createElement("form");
  editor.className = "c20-form";
  editor.style.cssText = "margin: 20px 0 30px 0;";

  if (typeof createTextInput === "function") {
    editor.appendChild(createTextInput({ name: "name", title: "Name", value: data.name, required: true }));
    editor.appendChild(createTextInput({ name: "source", title: "Source", value: data.source, required: false }));
  }

  if (typeof createTextAreaInput === "function") {
    editor.appendChild(
      createTextAreaInput({
        name: "description",
        title: "Description",
        value: data.description,
        required: false,
        height: 320,
      }),
    );
  }

  if (typeof createHiddenInput === "function") {
    editor.appendChild(createHiddenInput({ name: "type", value: data.type || "trait" }));

    // FIXED: Ensured clear fallback checks to block null identifiers from spawning duplicate zombie records
    if (data.id !== undefined && data.id !== null && data.id !== "") {
      editor.appendChild(createHiddenInput({ name: "id", value: data.id }));
    }
  }

  return editor;
}
