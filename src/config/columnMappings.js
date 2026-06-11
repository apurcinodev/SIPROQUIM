const columnSynonyms = {
  productName: [
    "pn",
    "p/n",
    "produto",
    "nome do produto",
    "descricao",
    "descricao material",
    "material",
    "item",
    "nome material",
    "produto quimico",
    "nomenclatura"
  ],
  date: [
    "data",
    "data movimentacao",
    "dt movimentacao",
    "emissao",
    "data lancamento",
    "data do movimento"
  ],
  movementType: [
    "tp",
    "tipo",
    "tipo movimentacao",
    "movimentacao",
    "tipo de movimentacao",
    "natureza",
    "entrada ou saida"
  ],
  reason: [
    "razao",
    "motivo",
    "finalidade",
    "justificativa",
    "motivo movimentacao",
    "ocorrencia",
    "historico"
  ],
  document: [
    "documento",
    "doc",
    "nota",
    "nf",
    "numero documento",
    "requisicao",
    "pedido",
    "lancamento"
  ],
  quantity: [
    "quantidade",
    "qtd",
    "qtde",
    "volume",
    "peso",
    "saldo movimentado"
  ],
  unit: [
    "ue",
    "unidade",
    "un",
    "um",
    "u.m.",
    "unid"
  ],
  sector: [
    "setor",
    "local",
    "centro de custo",
    "departamento",
    "destino",
    "origem"
  ],
  responsible: [
    "responsavel",
    "solicitante",
    "usuario",
    "colaborador",
    "atendente"
  ],
  notes: [
    "observacao",
    "observacoes",
    "obs",
    "comentario",
    "detalhes",
    "anotacoes"
  ]
};

const defaultOptions = {
  comparisonMode: "hybrid",
  fuzzyThreshold: 0.9,
  controlledPdf: {
    minimumProductLength: 4,
    skipPatterns: [
      /^lista/i,
      /^policia federal/i,
      /^anexo/i,
      /^pagina/i,
      /^\d+$/,
      /^produto/i,
      /^n[ou]m(en)?clatura/i
    ]
  }
};

module.exports = {
  columnSynonyms,
  defaultOptions
};
