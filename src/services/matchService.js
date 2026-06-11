const { distance } = require("fastest-levenshtein");

const { defaultOptions } = require("../config/columnMappings");
const { tokenize } = require("../utils/text");

function similarity(left, right) {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) {
    return 0;
  }

  return 1 - distance(left, right) / maxLength;
}

function tokenCoverage(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (!leftTokens.length || !rightTokens.length) {
    return 0;
  }

  const shared = leftTokens.filter((token) => rightTokens.includes(token)).length;
  return shared / Math.max(leftTokens.length, rightTokens.length);
}

function containmentScore(left, right) {
  if (!left || !right) {
    return 0;
  }

  if (left.includes(right) || right.includes(left)) {
    return 1;
  }

  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const smaller = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
  const larger = leftTokens.length > rightTokens.length ? leftTokens : rightTokens;

  if (!smaller.length) {
    return 0;
  }

  const covered = smaller.filter((token) => larger.includes(token)).length;
  return covered / smaller.length;
}

function buildMatch(controlledProduct, movement, options = defaultOptions) {
  const exact = controlledProduct.normalizedName === movement.normalizedName;
  const score = Math.max(
    similarity(controlledProduct.normalizedName, movement.normalizedName),
    tokenCoverage(controlledProduct.normalizedName, movement.normalizedName),
    containmentScore(controlledProduct.normalizedName, movement.normalizedName)
  );
  const approximate = score >= options.fuzzyThreshold;
  const matched = options.comparisonMode === "exact" ? exact : exact || approximate;

  if (!matched) {
    return null;
  }

  return {
    controlledProduct: controlledProduct.name,
    movementProduct: movement.productName,
    matchType: exact ? "exact" : "approximate",
    score: Number(score.toFixed(4)),
    movement
  };
}

function compareProducts(controlledProducts, movementRows, options = defaultOptions) {
  const matchesByProduct = [];
  const withoutMovement = [];

  controlledProducts.forEach((product) => {
    const matches = movementRows
      .map((movement) => buildMatch(product, movement, options))
      .filter(Boolean);

    if (matches.length) {
      matchesByProduct.push({
        productName: product.name,
        normalizedName: product.normalizedName,
        matchCount: matches.length,
        matches
      });
    } else {
      withoutMovement.push({
        productName: product.name,
        normalizedName: product.normalizedName
      });
    }
  });

  return {
    matchedProducts: matchesByProduct,
    unmatchedProducts: withoutMovement
  };
}

module.exports = {
  compareProducts
};
