const normalizeMeasurementForStorage = (value) => {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? JSON.stringify([trimmed]) : JSON.stringify([]);
  }

  if (value === undefined || value === null) {
    return JSON.stringify([]);
  }

  return JSON.stringify([String(value)]);
};

const parseMeasurementValue = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [trimmed];
    } catch (error) {
      return [trimmed];
    }
  }

  return [];
};

module.exports = {
  normalizeMeasurementForStorage,
  parseMeasurementValue,
};
