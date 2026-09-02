const ADDRESS_ABBREVIATIONS = new Set([
  'no', 'n0', 'st', 'street', 'rd', 'road', 'ave', 'avenue', 'dr', 'drive', 'ln', 'lane', 'ct', 'court', 'pl', 'place',
  'blvd', 'boulevard', 'cres', 'crescent', 'cl', 'close', 'way', 'blk', 'block', 'unit', 'apt', 'apartment', 'suite',
  'floor', 'bldg', 'building', 'hse', 'house',
]);

const sanitizeAddressForShipbubble = (value) => {
  if (!value) return '';

  const normalized = String(value)
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !ADDRESS_ABBREVIATIONS.has(word.toLowerCase()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || String(value).trim();
};

module.exports = {
  sanitizeAddressForShipbubble,
};
