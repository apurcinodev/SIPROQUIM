import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildExportFile } = require("../../src/services/exportService");
const { AppError, formatError } = require("../../src/utils/errors");

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new AppError("JSON de exportacao invalido.", 400, error.message);
  }
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Metodo nao permitido." },
      405,
      { Allow: "POST" }
    );
  }

  try {
    const { format, report } = await readJson(request);

    if (!format || !report) {
      throw new AppError("Formato e relatorio sao obrigatorios para exportacao.", 400);
    }

    const exported = await buildExportFile({ format, report });

    return new Response(exported.buffer, {
      status: 200,
      headers: {
        "Content-Type": exported.contentType,
        "Content-Disposition": `attachment; filename="${exported.fileName}"`
      }
    });
  } catch (error) {
    const formatted = formatError(error);
    return jsonResponse(formatted.body, formatted.statusCode);
  }
}

export const config = {
  path: "/api/export"
};
