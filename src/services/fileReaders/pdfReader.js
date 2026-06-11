const { defaultOptions } = require("../../config/columnMappings");
const { AppError } = require("../../utils/errors");
const { normalizeText } = require("../../utils/text");
const { extractPdfText } = require("./pdfTextExtractor");

function looksLikeProductLine(line, options) {
  if (!line) {
    return false;
  }

  if (line.length < options.minimumProductLength) {
    return false;
  }

  return !options.skipPatterns.some((pattern) => pattern.test(line));
}

function extractProductsFromPdfText(text, options = defaultOptions.controlledPdf) {
  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const unique = new Map();

  rawLines.forEach((line, index) => {
    const sanitized = line.replace(/\s{2,}/g, " ").trim();

    if (!looksLikeProductLine(sanitized, options)) {
      return;
    }

    const normalized = normalizeText(sanitized);
    if (!normalized) {
      return;
    }

    if (!unique.has(normalized)) {
      unique.set(normalized, {
        id: index + 1,
        name: sanitized,
        normalizedName: normalized,
        source: "pdf"
      });
    }
  });

  return Array.from(unique.values());
}

async function readControlledPdf(file) {
  if (!file?.buffer) {
    throw new AppError("Arquivo PDF da lista de controlados nao foi recebido.", 400);
  }

  try {
    const text = await extractPdfText(file.buffer);
    const products = extractProductsFromPdfText(text);

    if (!products.length) {
      throw new AppError(
        "Nao foi possivel identificar produtos no PDF. Verifique se o arquivo contem texto selecionavel.",
        422
      );
    }

    return {
      fileType: "pdf",
      products
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Falha ao ler o PDF da lista de controlados.", 422, error.message);
  }
}

module.exports = {
  readControlledPdf
};
