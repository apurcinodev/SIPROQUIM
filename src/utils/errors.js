class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function formatError(error) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
        details: error.details
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "Erro interno ao processar a solicitacao.",
      details: error.message
    }
  };
}

module.exports = {
  AppError,
  formatError
};
