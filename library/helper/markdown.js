function createMardownDisplay(text) {
  // Convert a text string that may contain markdown tables into a DocumentFragment
  // without using innerHTML. Non-table text blocks are preserved as <div> with
  // pre-wrapped whitespace so line breaks are visible.
  function splitRow(line) {
    // remove leading/trailing pipe and split on |, trimming each cell
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) line = line.trim().slice(1, -1);
    return line.split("|").map((s) => s.trim());
  }

  function parseDivider(line) {
    // parse alignment from divider cells, e.g. ":---", "---:", ":---:"
    const cells = splitRow(line);
    return cells.map((c) => {
      const t = c.trim();
      if (t.startsWith(":") && t.endsWith(":")) return "center";
      if (t.endsWith(":")) return "right";
      if (t.startsWith(":")) return "left";
      return "left"; // default
    });
  }

  function createTable(headerLine, dividerLine, rowLines) {
    const headers = splitRow(headerLine);
    const aligns = parseDivider(dividerLine);
    const table = document.createElement("table");
    table.className = "c20-markdown-table";
    // simple styling — rely on CSS for better control
    table.style.borderCollapse = "collapse";
    table.style.margin = "8px 0";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((h, idx) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.textAlign = aligns[idx] || "left";
      th.style.border = "1px solid var(--border-color, #ddd)";
      th.style.padding = "4px 6px";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rowLines.forEach((r) => {
      const cols = splitRow(r);
      const tr = document.createElement("tr");
      headers.forEach((_, idx) => {
        const td = document.createElement("td");
        td.textContent = cols[idx] ?? "";
        td.style.border = "1px solid var(--border-color, #ddd)";
        td.style.padding = "4px 6px";
        td.style.textAlign = aligns[idx] || "left";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  function isDividerLine(line) {
    // divider line typically contains dashes and pipes, optionally colons for alignment
    const cleaned = line.trim();
    if (!cleaned) return false;
    // must contain '-' and '|' or at least '-' and ':' in reasonable quantity
    return /-/.test(cleaned) && (cleaned.includes("|") || cleaned.includes(":"));
  }

  const frag = document.createDocumentFragment();
  const lines = text.split(/\r?\n/);
  let i = 0;
  let buffer = [];

  function flushBuffer() {
    if (buffer.length === 0) return;
    const div = document.createElement("div");
    div.style.whiteSpace = "pre-wrap"; // preserve line breaks
    div.textContent = buffer.join("\n");
    frag.appendChild(div);
    buffer = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    // detect potential table header (contains |) and next line is divider
    if (line.includes("|") && i + 1 < lines.length && isDividerLine(lines[i + 1])) {
      // collect table lines until a blank line or a line without |
      const headerLine = line;
      const dividerLine = lines[i + 1];
      const rowLines = [];
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|")) {
        rowLines.push(lines[j]);
        j++;
      }
      // flush any pending text before appending table
      flushBuffer();
      const table = createTable(headerLine, dividerLine, rowLines);
      frag.appendChild(table);
      i = j;
    } else {
      buffer.push(line);
      i++;
    }
  }

  flushBuffer();
  return frag;
}
