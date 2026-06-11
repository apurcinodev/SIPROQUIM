const { defaultOptions } = require("../config/columnMappings");
const { readControlledFile, readMovementFile } = require("./fileReaders");
const { normalizeMovementRows } = require("./normalizationService");
const { compareProducts } = require("./matchService");
const { buildReport } = require("./reportService");

async function processFiles({ controlledFile, movementFile, options = {} }) {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  };

  const controlledSummary = await readControlledFile(controlledFile);
  const movementSummary = await readMovementFile(movementFile);
  const normalizedMovements = normalizeMovementRows(
    movementSummary.rows,
    movementSummary.mappedHeaders
  );

  const comparisonResult = compareProducts(
    controlledSummary.products,
    normalizedMovements,
    mergedOptions
  );

  const report = buildReport({
    controlledSummary,
    movementSummary,
    comparisonResult
  });

  return report;
}

module.exports = {
  processFiles
};
