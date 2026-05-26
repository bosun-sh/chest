export const nowIso = (): string => new Date().toISOString();

export const timeStampForFile = (value: Date = new Date()): string =>
  value.toISOString().replace(/[:.]/g, "-");
