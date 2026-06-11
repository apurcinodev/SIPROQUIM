const path = require("path");

const { AppError } = require("../../utils/errors");
const { readControlledPdf } = require("./pdfReader");
const { readMovementPdf } = require("./movementPdfReader");
const { readMovementSheet } = require("./spreadsheetReader");

function getExtension(fileName = "") {
  return path.extname(fileName).toLowerCase();
}

async function readControlledFile(file) {
  const extension = getExtension(file.originalname);

  if (extension !== ".pdf") {
    throw new AppError("A lista de controlados deve ser enviada em PDF.", 422);
  }

  return readControlledPdf(file);
}

async function readMovementFile(file) {
  const extension = getExtension(file.originalname);
  const allowed = [".xls", ".xlsx", ".csv", ".pdf"];

  if (!allowed.includes(extension)) {
    throw new AppError("A movimentacao deve ser XLS, XLSX, CSV ou PDF.", 422);
  }

  if (extension === ".pdf") {
    return readMovementPdf(file);
  }

  return readMovementSheet(file);
}

module.exports = {
  readControlledFile,
  readMovementFile
};
