const pdfParse = require("pdf-parse");
const path = require("path");
const { pathToFileURL } = require("url");

async function extractTextWithPdfJs(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsPackagePath = require.resolve("pdfjs-dist/package.json");
  const standardFontDataUrl = pathToFileURL(
    path.join(path.dirname(pdfjsPackagePath), "standard_fonts")
  ).href.replace(/\/?$/, "/");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    standardFontDataUrl
  }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = [];
    let currentY = null;
    let currentLine = [];

    content.items.forEach((item) => {
      const y = item.transform?.[5];

      if (currentY !== null && Math.abs(y - currentY) > 2) {
        lines.push(currentLine.join(" ").trim());
        currentLine = [];
      }

      currentY = y;
      currentLine.push(item.str);
    });

    if (currentLine.length) {
      lines.push(currentLine.join(" ").trim());
    }

    pages.push(lines.filter(Boolean).join("\n"));
  }

  return pages.join("\n");
}

async function extractPdfText(buffer) {
  try {
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  } catch (error) {
    return extractTextWithPdfJs(buffer);
  }
}

module.exports = {
  extractPdfText
};
