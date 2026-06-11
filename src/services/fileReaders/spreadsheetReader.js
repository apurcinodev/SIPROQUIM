const xlsx = require("xlsx");

const { columnSynonyms } = require("../../config/columnMappings");
const { AppError } = require("../../utils/errors");
const { normalizeText } = require("../../utils/text");

const requiredProductHeaders = ["pn", "nomenclatura"];

function hasRequiredProductHeader(header) {
  const normalized = normalizeText(header);
  return requiredProductHeaders.some(
    (required) => normalized === required || normalized.includes(required)
  );
}

function pickBestHeader(headers, synonyms) {
  for (const synonym of synonyms) {
    const normalizedSynonym = normalizeText(synonym);
    const matched = headers.find((header) => normalizeText(header) === normalizedSynonym);
    if (matched) {
      return matched;
    }
  }

  for (const synonym of synonyms) {
    const normalizedSynonym = normalizeText(synonym);
    if (normalizedSynonym.length < 3) {
      continue;
    }

    const matched = headers.find((header) => normalizeText(header).includes(normalizedSynonym));
    if (matched) {
      return matched;
    }
  }

  return null;
}

function mapHeaders(headers) {
  const mapped = {};

  Object.entries(columnSynonyms).forEach(([key, synonyms]) => {
    mapped[key] = pickBestHeader(headers, synonyms);
  });

  return mapped;
}

function readWorkbook(file) {
  try {
    return xlsx.read(file.buffer, { type: "buffer", cellDates: true });
  } catch (error) {
    throw new AppError("Falha ao ler a planilha de movimentacao.", 422, error.message);
  }
}

function extractRowsFromSheet(sheet) {
  return xlsx.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false
  });
}

function readMovementSheet(file) {
  if (!file?.buffer) {
    throw new AppError("Arquivo da planilha de movimentacao nao foi recebido.", 400);
  }

  const workbook = readWorkbook(file);
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new AppError("A planilha enviada nao contem abas legiveis.", 422);
  }

  const rows = extractRowsFromSheet(firstSheet);

  if (!rows.length) {
    throw new AppError("A planilha de movimentacao nao contem dados.", 422);
  }

  const headers = Object.keys(rows[0]);
  const mappedHeaders = mapHeaders(headers);

  if (!mappedHeaders.productName || !hasRequiredProductHeader(mappedHeaders.productName)) {
    throw new AppError(
      "Na movimentacao mensal, o produto deve estar na coluna PN ou NOMENCLATURA.",
      422,
      { headers }
    );
  }

  return {
    fileType: "spreadsheet",
    sheetName: firstSheetName,
    headers,
    mappedHeaders,
    rows
  };
}

module.exports = {
  readMovementSheet
};
