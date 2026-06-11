function flattenMatches(matchedProducts) {
  return matchedProducts.flatMap((product) =>
    product.matches.map((match) => ({
      produtoControlado: product.productName,
      produtoMovimentado: match.movementProduct,
      tipoCorrespondencia: match.matchType,
      confianca: match.score,
      data: match.movement.date,
      tipoMovimentacao: match.movement.movementType,
      motivo: match.movement.reason,
      documento: match.movement.document,
      quantidade: match.movement.quantity,
      unidade: match.movement.unit,
      setor: match.movement.sector,
      responsavel: match.movement.responsible,
      observacoes: match.movement.notes,
      linhaOrigem: match.movement.rowNumber
    }))
  );
}

function buildReport({
  controlledSummary,
  movementSummary,
  comparisonResult
}) {
  const detailedMovements = flattenMatches(comparisonResult.matchedProducts);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalControlledProducts: controlledSummary.products.length,
      totalMovementRows: movementSummary.rows.length,
      matchedProducts: comparisonResult.matchedProducts.length,
      totalMatchedMovements: detailedMovements.length
    },
    detectedColumns: movementSummary.mappedHeaders,
    controlledProducts: controlledSummary.products,
    matchedProducts: comparisonResult.matchedProducts,
    detailedMovements
  };
}

module.exports = {
  buildReport
};
