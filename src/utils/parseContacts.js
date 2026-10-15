// Lê uma lista de contatos colada ou vinda de um arquivo .csv/.txt.
// Aceita:
//   - CSV com cabeçalho (colunas "email"/"e-mail" e "nome"/"name"), separado
//     por vírgula, ponto e vírgula ou tab (Excel em português usa ";")
//   - uma pessoa por linha, sem cabeçalho: "Nome <email>", "Nome, email",
//     "email; Nome" ou só o email
// Devolve { rows: [{ line, email, name }], invalid: [{ line, text }], duplicates }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_HEADERS = ["email", "e-mail", "e_mail", "mail", "endereco de email", "email address"];
const NAME_HEADERS = ["nome", "name", "nome completo", "full name", "primeiro nome", "first name"];

const normalizeHeader = (h) =>
  h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^"|"$/g, "").trim();

function detectDelimiter(lines) {
  const sample = lines.slice(0, 10).join("\n");
  const counts = { ";": 0, ",": 0, "\t": 0 };
  for (const ch of sample) if (ch in counts) counts[ch]++;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}

// Divide uma linha CSV respeitando aspas ("Silva, João";joao@x.com)
function splitLine(line, delimiter) {
  if (!delimiter) return [line];
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

// "Nome <email>", ou a célula com @ é o email e o resto é o nome
function freeForm(raw, delimiter) {
  const angle = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (angle) return { name: angle[1], email: angle[2] };
  const cells = splitLine(raw, delimiter);
  const idx = cells.findIndex((c) => c.includes("@"));
  if (idx === -1) return { name: "", email: raw };
  return { email: cells[idx], name: cells.filter((_, j) => j !== idx).join(" ") };
}

const cleanName = (name) => name.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, " ").slice(0, 120);

export function parseContacts(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim());
  const delimiter = detectDelimiter(nonEmpty);

  // Cabeçalho: primeira linha sem email e com uma coluna de email reconhecida
  let emailCol = -1;
  let nameCol = -1;
  let start = 0;
  const firstIndex = lines.findIndex((l) => l.trim());
  if (firstIndex !== -1 && !lines[firstIndex].includes("@")) {
    const headers = splitLine(lines[firstIndex], delimiter).map(normalizeHeader);
    emailCol = headers.findIndex((h) => EMAIL_HEADERS.includes(h));
    nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h));
    if (emailCol !== -1) start = firstIndex + 1;
  }

  const rows = [];
  const invalid = [];
  const seen = new Set();
  let duplicates = 0;

  for (let i = start; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const line = i + 1;
    let email = "";
    let name = "";

    if (emailCol !== -1) {
      const cells = splitLine(raw, delimiter);
      email = cells[emailCol] || "";
      name = nameCol !== -1 ? cells[nameCol] || "" : "";
    }
    // Sem cabeçalho, ou linha fora do formato das colunas: lê a linha livre
    if (!EMAIL_RE.test(email.replace(/^["'<\s]+|["'>\s]+$/g, ""))) {
      ({ email, name } = freeForm(raw, delimiter));
    }

    email = email.replace(/^["'<\s]+|["'>\s]+$/g, "").toLowerCase();
    name = cleanName(name);

    if (!EMAIL_RE.test(email)) {
      invalid.push({ line, text: raw.slice(0, 80) });
      continue;
    }
    if (seen.has(email)) {
      duplicates++;
      continue;
    }
    seen.add(email);
    rows.push({ line, email, name });
  }

  return { rows, invalid, duplicates };
}
