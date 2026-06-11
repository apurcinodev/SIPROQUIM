import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { processFiles } = require("../../src/services/comparisonService");
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

async function toUploadFile(file, fieldName) {
  if (!file || typeof file.arrayBuffer !== "function") {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    fieldname: fieldName,
    originalname: file.name || `${fieldName}.bin`,
    mimetype: file.type || "application/octet-stream",
    size: buffer.length,
    buffer
  };
}

function parseOptions(rawOptions) {
  if (!rawOptions || typeof rawOptions !== "string") {
    return {};
  }

  try {
    return JSON.parse(rawOptions);
  } catch (error) {
    throw new AppError("Opcoes de processamento invalidas.", 400, error.message);
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
    const formData = await request.formData();
    const controlledFile = await toUploadFile(
      formData.get("controlledList"),
      "controlledList"
    );
    const movementFile = await toUploadFile(
      formData.get("movementSheet"),
      "movementSheet"
    );
    const options = parseOptions(formData.get("options"));

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

    return jsonResponse(result);
  } catch (error) {
    const formatted = formatError(error);
    return jsonResponse(formatted.body, formatted.statusCode);
  }
}

export const config = {
  path: "/api/process"
};
