export const parseYaml = <T>(text: string): T => {
  const trimmed = text.trim();

  if (trimmed === "") {
    return [] as T;
  }

  return JSON.parse(trimmed) as T;
};

export const stringifyYaml = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;
