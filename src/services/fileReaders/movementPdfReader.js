const path = require("path");
const { pathToFileURL } = require("url");

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

async function loadPdfDocument(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json");
  const standardFontDataUrl = pathToFileURL(
    path.join(path.dirname(pdfjsPackagePath), "standard_fonts")
  ).href.replace(/\/?$/, "/");

  return pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    standardFontDataUrl
  }).promise;
}

function groupItemsIntoRows(items) {
  const rows = [];

  items.forEach((item) => {
    const text = String(item.str || "").trim();
    if (!text) {
      return;
    }

    const x = item.transform?.[4] || 0;
    const y = item.transform?.[5] || 0;
    const existingRow = rows.find((row) => Math.abs(row.y - y) <= 2);

    if (existingRow) {
      existingRow.items.push({ text, x, y });
      existingRow.y = Math.max(existingRow.y, y);
      return;
    }

    rows.push({
      y,
      items: [{ text, x, y }]
    });
  });

  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => ({
      y: row.y,
      items: row.items.sort((left, right) => left.x - right.x)
    }));
}

function getHeaderCells(row) {
  return row.items.map((item) => ({
    name: item.text,
    x: item.x
  }));
}

function detectHeaderRow(rows) {
  return rows.findIndex((row) =>
    row.items.some((item) => hasRequiredProductHeader(item.text))
  );
}

function buildColumnBoundaries(headerCells) {
  return headerCells.map((cell, index) => {
    const nextCell = headerCells[index + 1];
    const limit = nextCell ? (cell.x + nextCell.x) / 2 : Number.POSITIVE_INFINITY;

    return {
      name: cell.name,
      x: cell.x,
      limit
    };
  });
}

function buildRowObject(row, columns) {
  const data = {};

  columns.forEach((column) => {
    data[column.name] = "";
  });

  row.items.forEach((item) => {
    const column = columns.find((candidate) => item.x < candidate.limit);
    if (!column) {
      return;
    }

    data[column.name] = data[column.name]
      ? `${data[column.name]} ${item.text}`.trim()
      : item.text;
  });

  return data;
}

function pickMappedHeader(headers, synonyms, requirePnOrNomenclatura = false) {
  return (
    headers.find((header) => {
      const normalized = normalizeText(header);
      const matches = synonyms.some(
        (synonym) => {
          const normalizedSynonym = normalizeText(synonym);
          if (normalized === normalizedSynonym) {
            return true;
          }

          if (normalizedSynonym.length < 3) {
            return false;
          }

          return normalized.includes(normalizedSynonym);
        }
      );

      if (!matches) {
        return false;
      }

      return !requirePnOrNomenclatura || hasRequiredProductHeader(header);
    }) || null
  );
}

function mapHeaders(headers) {
  const mapped = {};

  Object.entries(columnSynonyms).forEach(([key, synonyms]) => {
    mapped[key] = pickMappedHeader(headers, synonyms, key === "productName");
  });

  return mapped;
}

function mergeContinuationRows(rows, mappedHeaders) {
  const merged = [];
  const auxiliaryHeaders = Object.values(mappedHeaders).filter(
    (header) => header && header !== mappedHeaders.productName
  );

  rows.forEach((row) => {
    const productValue = row[mappedHeaders.productName];
    const hasAuxiliaryData = auxiliaryHeaders.some((header) => String(row[header] || "").trim());

    if (!hasAuxiliaryData && merged.length) {
      const previous = merged[merged.length - 1];
      previous[mappedHeaders.productName] =
        `${previous[mappedHeaders.productName]} ${productValue}`.trim();
      return;
    }

    merged.push({ ...row });
  });

  return merged;
}

async function readMovementPdf(file) {
  if (!file?.buffer) {
    throw new AppError("Arquivo PDF da movimentacao nao foi recebido.", 400);
  }

  const document = await loadPdfDocument(file.buffer);
  let headers = null;
  let rows = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const groupedRows = groupItemsIntoRows(content.items);
    const headerRowIndex = detectHeaderRow(groupedRows);

    if (headerRowIndex < 0) {
      continue;
    }

    const pageHeaders = getHeaderCells(groupedRows[headerRowIndex]);
    const columns = buildColumnBoundaries(pageHeaders);
    const pageRows = groupedRows
      .slice(headerRowIndex + 1)
      .map((row) => buildRowObject(row, columns))
      .filter((row) => Object.values(row).some(Boolean));

    headers = pageHeaders.map((cell) => cell.name);
    rows = rows.concat(pageRows);
  }

  if (!headers?.length) {
    throw new AppError(
      "Nao foi encontrado no PDF de movimentacao um cabecalho com a coluna PN ou NOMENCLATURA.",
      422
    );
  }

  if (!rows.length) {
    throw new AppError("Nao foi possivel identificar linhas de movimentacao no PDF.", 422);
  }

  const mappedHeaders = mapHeaders(headers);

  if (!mappedHeaders.productName) {
    throw new AppError(
      "No PDF de movimentacao, a busca de produto deve ocorrer na coluna PN ou NOMENCLATURA.",
      422,
      { headers }
    );
  }

  rows = rows.filter((row) => {
    const productValue = row[mappedHeaders.productName];
    if (!productValue) {
      return false;
    }

    return normalizeText(productValue) !== normalizeText(mappedHeaders.productName);
  });
  rows = mergeContinuationRows(rows, mappedHeaders);

  if (!rows.length) {
    throw new AppError("Nao foi possivel identificar linhas validas de movimentacao no PDF.", 422);
  }

  return {
    fileType: "pdf",
    sheetName: "PDF",
    headers,
    mappedHeaders,
    rows
  };
}

module.exports = {
  readMovementPdf
};
