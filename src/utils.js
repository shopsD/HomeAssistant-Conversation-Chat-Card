export const safe = value => String(value ?? '');
export const normalized = value => safe(value).trim();
export const unique = values => [...new Set(values.filter(Boolean))];
