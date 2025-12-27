function createMarkdownDisplay(text) {
  // Convert a text string that may contain markdown tables into a DocumentFragment
  // without using innerHTML. Supports bold (**text**), italic (*text* or _text_),
  // and bold+italic (***text***). Non-table text blocks are preserved as <div>
  // with pre-wrapped whitespace so line breaks are visible.

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

  // Parse inline markdown for bold/italic and return a DocumentFragment
  function nodesFromInline(text) {
    const frag = document.createDocumentFragment();
    if (!text) return frag;

    const regex = /(\*\*\*([\s\S]+?)\*\*\*)|(\*\*([\s\S]+?)\*\*)|(\*([^*]+?)\*)|(_([^_]+?)_)/g;
    let lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const idx = m.index;
      if (idx > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
      }

      if (m[2]) {
        // ***bold+italic*** => <strong><em>...</em></strong>
        const strong = document.createElement("strong");
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(m[2]));
        strong.appendChild(em);
        frag.appendChild(strong);
      } else if (m[4]) {
        // **bold**
        const strong = document.createElement("strong");
        strong.appendChild(nodesFromInline(m[4]));
        frag.appendChild(strong);
      } else if (m[6]) {
        // *italic*
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(m[6]));
        frag.appendChild(em);
      } else if (m[8]) {
        // _italic_
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(m[8]));
        frag.appendChild(em);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    return frag;
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
      th.style.textAlign = aligns[idx] || "left";
      th.style.border = "1px solid var(--border-color, #ddd)";
      th.style.padding = "4px 6px";
      th.appendChild(nodesFromInline(h));
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
        td.style.border = "1px solid var(--border-color, #ddd)";
        td.style.padding = "4px 6px";
        td.style.textAlign = aligns[idx] || "left";
        td.appendChild(nodesFromInline(cols[idx] ?? ""));
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
    buffer.forEach((line, idx) => {
      div.appendChild(nodesFromInline(line));
      if (idx < buffer.length - 1) div.appendChild(document.createElement("br"));
    });
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
