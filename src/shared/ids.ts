export const newId = (): string => {
  const cryptoAny = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoAny?.randomUUID) {
    return cryptoAny.randomUUID();
  }

  return `chest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
