const path = require("path");
const express = require("express");
const multer = require("multer");

const { processFiles } = require("./services/comparisonService");
const { buildExportFile } = require("./services/exportService");
const { AppError, formatError } = require("./utils/errors");

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/images", express.static(path.join(__dirname, "..", "images")));
app.use("/font", express.static(path.join(__dirname, "..", "font")));

app.post(
  "/api/process",
  upload.fields([
    { name: "controlledList", maxCount: 1 },
    { name: "movementSheet", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const controlledFile = req.files?.controlledList?.[0];
      const movementFile = req.files?.movementSheet?.[0];
      const options = req.body?.options ? JSON.parse(req.body.options) : {};

      if (!controlledFile || !movementFile) {
        throw new AppError(
          "Os dois arquivos sao obrigatorios para realizar a comparacao.",
          400
        );
      }

      const result = await processFiles({
        controlledFile,
        movementFile,
        options
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/export", async (req, res, next) => {
  try {
    const { format, report } = req.body || {};

    if (!format || !report) {
      throw new AppError("Formato e relatorio sao obrigatorios para exportacao.", 400);
    }

    const exported = await buildExportFile({ format, report });

    res.setHeader("Content-Type", exported.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exported.fileName}"`
    );
    res.send(exported.buffer);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Rota nao encontrada." });
});

app.use((error, req, res, next) => {
  const formatted = formatError(error);
  res.status(formatted.statusCode).json(formatted.body);
});

app.listen(port, () => {
  console.log(`Servidor em execucao: http://localhost:${port}`);
});
