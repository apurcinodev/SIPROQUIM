const { parseNumber, normalizeText } = require("../utils/text");

function normalizeMovementRows(rows, mappedHeaders) {
  return rows
    .map((row, index) => {
      const productName = row[mappedHeaders.productName] || "";

      return {
        rowNumber: index + 2,
        original: row,
        productName,
        normalizedName: normalizeText(productName),
        date: mappedHeaders.date ? row[mappedHeaders.date] || "" : "",
        movementType: mappedHeaders.movementType ? row[mappedHeaders.movementType] || "" : "",
        reason: mappedHeaders.reason ? row[mappedHeaders.reason] || "" : "",
        document: mappedHeaders.document ? row[mappedHeaders.document] || "" : "",
        quantity: mappedHeaders.quantity ? row[mappedHeaders.quantity] || "" : "",
        quantityValue: mappedHeaders.quantity ? parseNumber(row[mappedHeaders.quantity]) : null,
        unit: mappedHeaders.unit ? row[mappedHeaders.unit] || "" : "",
        sector: mappedHeaders.sector ? row[mappedHeaders.sector] || "" : "",
        responsible: mappedHeaders.responsible ? row[mappedHeaders.responsible] || "" : "",
        notes: mappedHeaders.notes ? row[mappedHeaders.notes] || "" : ""
      };
    })
    .filter((row) => row.normalizedName);
}

module.exports = {
  normalizeMovementRows
};
