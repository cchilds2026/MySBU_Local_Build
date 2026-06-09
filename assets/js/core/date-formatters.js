const EASTERN_TIME_ZONE = "America/New_York";

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function looksLikeLegacyDisplayDate(value) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(String(value).trim());
}

function looksLikeLegacyDisplayTime(value) {
  return /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(String(value).trim());
}

function looksLikeLegacyDisplayDateTime(value) {
  return /^\d{2}\/\d{2}\/\d{4},?\s+\d{1,2}:\d{2}\s?(AM|PM)$/i.test(String(value).trim());
}

function normalizeInput(value) {
  if (isBlank(value)) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  if (
    looksLikeLegacyDisplayDate(text) ||
    looksLikeLegacyDisplayTime(text) ||
    looksLikeLegacyDisplayDateTime(text)
  ) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return parsed;
}

function formatDateParts(date, options) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    ...options
  }).format(date);
}

export function formatEasternDate(value, fallback = "—") {
  const normalized = normalizeInput(value);
  if (!normalized) return fallback;

  if (typeof normalized === "string") {
    return normalized;
  }

  return formatDateParts(normalized, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

export function formatEasternTime(value, fallback = "—") {
  const normalized = normalizeInput(value);
  if (!normalized) return fallback;

  if (typeof normalized === "string") {
    return normalized;
  }

  return formatDateParts(normalized, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function formatEasternDateTime(value, fallback = "—") {
  const normalized = normalizeInput(value);
  if (!normalized) return fallback;

  if (typeof normalized === "string") {
    return normalized;
  }

  const date = formatDateParts(normalized, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });

  const time = formatDateParts(normalized, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return `${date}, ${time} ET`;
}