const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const xlsx = require("xlsx");

const examplesDir = path.join(__dirname, "..", "examples");

function ensureDir(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function generatePdf() {
  const filePath = path.join(examplesDir, "lista-controlados-exemplo.pdf");
  const doc = new PDFDocument({
    margin: 50,
    pdfVersion: "1.4",
    compress: false
  });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);
  doc.fontSize(18).text("Lista de Produtos Quimicos Controlados - Exemplo");
  doc.moveDown();

  [
    "Acido Sulfurico",
    "Acetona",
    "Tolueno",
    "Peroxido de Hidrogenio",
    "Eter Etilico",
    "Metanol"
  ].forEach((product) => {
    doc.fontSize(12).text(product);
  });

  doc.end();

  return new Promise((resolve) => {
    stream.on("finish", resolve);
  });
}

function generateMovementPdf() {
  const filePath = path.join(examplesDir, "movimentacao-exemplo.pdf");
  const doc = new PDFDocument({
    margin: 40,
    pdfVersion: "1.4",
    compress: false
  });
  const stream = fs.createWriteStream(filePath);
  const columns = [
    { header: "PN", x: 40 },
    { header: "Data", x: 170 },
    { header: "Movimentacao", x: 240 },
    { header: "Motivo", x: 340 },
    { header: "Documento", x: 430 },
    { header: "Quantidade", x: 520 }
  ];
  const rows = [
    ["Acetona PA", "2026-02-03", "Saida", "Consumo", "REQ-1001", "5,0"],
    ["Acido sulfurico", "2026-02-10", "Entrada", "Transferencia", "NF-5502", "20,0"],
    ["Cloreto de sodio", "2026-02-12", "Saida", "Consumo", "REQ-1008", "3,0"],
    ["Peroxido hidrogenio 35%", "2026-02-18", "Saida", "Produto vencido", "AJ-004", "2,5"]
  ];

  doc.pipe(stream);
  doc.fontSize(16).text("Movimentacao Mensal - Exemplo", 40, 30);
  doc.fontSize(10);

  columns.forEach((column) => {
    doc.text(column.header, column.x, 80, { lineBreak: false });
  });

  rows.forEach((row, index) => {
    const y = 105 + index * 22;
    row.forEach((value, columnIndex) => {
      doc.text(String(value), columns[columnIndex].x, y, { lineBreak: false, width: 80 });
    });
  });

  doc.end();

  return new Promise((resolve) => {
    stream.on("finish", resolve);
  });
}

function generateSpreadsheet() {
  const filePath = path.join(examplesDir, "movimentacao-exemplo.xlsx");
  const rows = [
    {
      Nomenclatura: "Acetona PA",
      Data: "2026-02-03",
      Movimentacao: "Saida",
      Motivo: "Consumo",
      Documento: "REQ-1001",
      Quantidade: "5,0",
      Unidade: "L",
      Setor: "Laboratorio",
      Responsavel: "Ana Souza",
      Observacao: "Uso em analise"
    },
    {
      Nomenclatura: "Acido sulfurico",
      Data: "2026-02-10",
      Movimentacao: "Entrada",
      Motivo: "Transferencia",
      Documento: "NF-5502",
      Quantidade: "20,0",
      Unidade: "L",
      Setor: "Almoxarifado",
      Responsavel: "Carlos Lima",
      Observacao: "Reposicao mensal"
    },
    {
      Nomenclatura: "Cloreto de sodio",
      Data: "2026-02-12",
      Movimentacao: "Saida",
      Motivo: "Consumo",
      Documento: "REQ-1008",
      Quantidade: "3,0",
      Unidade: "kg",
      Setor: "Producao",
      Responsavel: "Marina Alves",
      Observacao: "Nao controlado"
    },
    {
      Nomenclatura: "Peroxido hidrogenio 35%",
      Data: "2026-02-18",
      Movimentacao: "Saida",
      Motivo: "Produto vencido",
      Documento: "AJ-004",
      Quantidade: "2,5",
      Unidade: "L",
      Setor: "Qualidade",
      Responsavel: "Joao Neri",
      Observacao: "Descartar conforme procedimento"
    }
  ];

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(workbook, sheet, "Movimentacao");
  xlsx.writeFile(workbook, filePath);
}

async function main() {
  ensureDir(examplesDir);
  await generatePdf();
  await generateMovementPdf();
  generateSpreadsheet();
  console.log(`Arquivos de exemplo gerados em ${examplesDir}`);
}

main();
