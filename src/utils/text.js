const stopWords = new Set(["de", "da", "do", "das", "dos", "para", "com"]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && !stopWords.has(token));
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const raw = String(value).trim();
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;

  if (hasComma && hasDot) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = raw.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

module.exports = {
  normalizeText,
  tokenize,
  parseNumber
};
