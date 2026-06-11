const xlsx = require("xlsx");

const { AppError } = require("../utils/errors");

function jsonExport(report) {
  return {
    fileName: "relatorio-controlados.json",
    contentType: "application/json; charset=utf-8",
    buffer: Buffer.from(JSON.stringify(report, null, 2), "utf-8")
  };
}

function csvExport(report) {
  const rows = report.detailedMovements;
  const sheet = xlsx.utils.json_to_sheet(rows);
  const csv = xlsx.utils.sheet_to_csv(sheet);

  return {
    fileName: "relatorio-controlados.csv",
    contentType: "text/csv; charset=utf-8",
    buffer: Buffer.from(csv, "utf-8")
  };
}

function xlsxExport(report) {
  const workbook = xlsx.utils.book_new();
  const summarySheet = xlsx.utils.json_to_sheet([report.summary]);
  const movementsSheet = xlsx.utils.json_to_sheet(report.detailedMovements);

  xlsx.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  xlsx.utils.book_append_sheet(workbook, movementsSheet, "Movimentacoes");

  const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

  return {
    fileName: "relatorio-controlados.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer
  };
}

async function buildExportFile({ format, report }) {
  switch (format) {
    case "json":
      return jsonExport(report);
    case "csv":
      return csvExport(report);
    case "xlsx":
      return xlsxExport(report);
    default:
      throw new AppError("Formato de exportacao invalido.", 400);
  }
}

module.exports = {
  buildExportFile
};
