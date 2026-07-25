function createMarkdownDisplay(text) {
  // Convert a text string that may contain markdown tables into a DocumentFragment
  // without using innerHTML. Supports bold (**text**), italic (*text* or _text_),
  // bold+italic (***text***), and headings (# h1, ## h2, ### h3, etc.).

  function splitRow(line) {
    let cleaned = line.trim();
    if (cleaned.startsWith("|") && cleaned.endsWith("|")) {
      cleaned = cleaned.slice(1, -1);
    }

    const cells = [];
    let currentCell = "";
    let isEscaped = false;

    for (let index = 0; index < cleaned.length; index++) {
      const char = cleaned[index];
      if (char === "\\" && !isEscaped) {
        isEscaped = true;
        currentCell += char;
      } else if (char === "|" && !isEscaped) {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        isEscaped = false;
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  }

  function parseDivider(line) {
    const cells = splitRow(line);
    return cells.map((c) => {
      const t = c.trim();
      if (t.startsWith(":") && t.endsWith(":")) return "center";
      if (t.endsWith(":")) return "right";
      if (t.startsWith(":")) return "left";
      return "left";
    });
  }

  function nodesFromInline(text) {
    const frag = document.createDocumentFragment();
    if (!text) return frag;

    const regex = /(\*\*\*([\s\S]+?)\*\*\*)|(\*\*([\s\S]+?)\*\*)|(\*([\s\S]+?)\*)|(_([\s\S]+?)_)/;
    let targetText = text;

    while (targetText) {
      const match = targetText.match(regex);
      if (!match) {
        frag.appendChild(document.createTextNode(targetText));
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        frag.appendChild(document.createTextNode(targetText.slice(0, matchIndex)));
      }

      let parsedNode = null;

      if (match[2]) {
        const strong = document.createElement("strong");
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(match[2]));
        strong.appendChild(em);
        parsedNode = strong;
      } else if (match[4]) {
        const strong = document.createElement("strong");
        strong.appendChild(nodesFromInline(match[4]));
        parsedNode = strong;
      } else if (match[6]) {
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(match[6]));
        parsedNode = em;
      } else if (match[8]) {
        const em = document.createElement("em");
        em.appendChild(nodesFromInline(match[8]));
        parsedNode = em;
      }

      if (parsedNode) {
        frag.appendChild(parsedNode);
      }

      targetText = targetText.slice(matchIndex + match[0].length);
    }

    return frag;
  }

  function createTable(headerLine, dividerLine, rowLines) {
    const headers = splitRow(headerLine);
    const aligns = parseDivider(dividerLine);
    const table = document.createElement("table");
    table.className = "c20-markdown-table";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((h, idx) => {
      const th = document.createElement("th");
      th.style.textAlign = aligns[idx] || "left";
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
    const cleaned = line.trim();
    if (!cleaned) return false;
    return /-/.test(cleaned) && (cleaned.includes("|") || cleaned.includes(":"));
  }

  function isListItem(line) {
    return /^\s*([-+*])\s+/.test(line);
  }

  function parseHeaderLine(line) {
    const match = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
    if (!match) return null;
    return {
      level: match[2].length,
      content: match[3],
    };
  }

  function createList(lines, startIndex) {
    const root = document.createElement("ul");
    root.className = "c20-markdown-list-root";
    const stack = [{ indent: 0, el: root }];
    let j = startIndex;

    while (j < lines.length) {
      const line = lines[j];
      if (line.trim() === "") break;

      const match = line.match(/^(\s*)([-+*])\s+(.+)$/);
      if (!match) break;

      const indent = match[1].length;
      const content = match[3];

      let last = stack[stack.length - 1];
      if (indent > last.indent) {
        const parentLi = last.el.lastElementChild;
        const ul = document.createElement("ul");
        ul.className = "c20-markdown-list-nested";
        if (parentLi) {
          parentLi.appendChild(ul);
        } else {
          last.el.appendChild(ul);
        }
        stack.push({ indent, el: ul });
      } else {
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop();
        }
      }

      const parentUl = stack[stack.length - 1].el;
      const li = document.createElement("li");
      li.appendChild(nodesFromInline(content));
      parentUl.appendChild(li);
      j++;
    }
    return { el: root, nextIndex: j };
  }

  const frag = document.createDocumentFragment();
  const lines = text.split(/\r?\n/);
  let i = 0;
  let buffer = [];

  function flushBuffer() {
    if (buffer.length === 0) return;

    const p = document.createElement("p");
    p.className = "c20-markdown-paragraph";

    buffer.forEach((line, idx) => {
      p.appendChild(nodesFromInline(line));
      if (idx < buffer.length - 1) {
        p.appendChild(document.createElement("br"));
      }
    });

    frag.appendChild(p);
    buffer = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "***" || line.trim() === "---") {
      flushBuffer();
      const hr = document.createElement("hr");
      hr.className = "c20-markdown-hr";
      frag.appendChild(hr);
      i++;
      continue;
    }

    const headingData = parseHeaderLine(line);
    if (headingData) {
      flushBuffer();

      const headingNode = document.createElement(`h${headingData.level}`);
      headingNode.className = `c20-markdown-h${headingData.level}`;
      headingNode.appendChild(nodesFromInline(headingData.content));
      frag.appendChild(headingNode);
      i++;
      continue;
    }

    if (isListItem(line)) {
      flushBuffer();
      const { el, nextIndex } = createList(lines, i);
      frag.appendChild(el);
      i = nextIndex;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isDividerLine(lines[i + 1])) {
      const headerLine = line;
      const dividerLine = lines[i + 1];
      const rowLines = [];
      let j = i + 2;

      while (j < lines.length && lines[j].includes("|")) {
        rowLines.push(lines[j]);
        j++;
      }

      flushBuffer();
      const table = createTable(headerLine, dividerLine, rowLines);
      frag.appendChild(table);

      // FIXED: Lookahead protection to consume trailing divider text lines so we skip redundant lines
      if (lines[j] && (lines[j].trim() === "***" || lines[j].trim() === "---")) {
        j++;
      }

      i = j;
    } else {
      buffer.push(line);
      i++;
    }
  }

  flushBuffer();
  return frag;
}
