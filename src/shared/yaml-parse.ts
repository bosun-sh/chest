export class YamlParseError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(message);
    this.name = "YamlParseError";
    this.line = line;
  }
}

type BunYamlApi = {
  parse(text: string): unknown;
  stringify(value: unknown): string;
};

const bunYaml = (globalThis as typeof globalThis & {
  Bun?: { YAML?: BunYamlApi };
}).Bun?.YAML;

const lineFromPosition = (text: string, position: number): number => {
  const prefix = text.slice(0, position);
  return prefix.split(/\r\n|\r|\n/).length;
};

const inferLineFromStructure = (text: string): number => {
  const lines = text.split(/\r\n|\r|\n/);
  let previousSignificant = "";
  let previousIndent = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const current = raw.trim();
    if (current === "") {
      continue;
    }

    const indent = raw.length - raw.trimStart().length;

    if (indent > previousIndent) {
      const previousAllowsIndent =
        previousSignificant.endsWith(":") ||
        previousSignificant.startsWith("- ") ||
        previousSignificant === "-";

      if (!previousAllowsIndent) {
        return index + 1;
      }
    }

    if (
      current.startsWith("{") &&
      previousSignificant.endsWith("}") &&
      !previousSignificant.endsWith(",")
    ) {
      return index + 1;
    }

    previousSignificant = current;
    previousIndent = indent;
  }

  return 1;
};

export const parseYaml = <T>(text: string): T => {
  const trimmed = text.trim();

  if (trimmed === "") {
    return [] as T;
  }

  try {
    if (bunYaml) {
      return bunYaml.parse(trimmed) as T;
    }

    return JSON.parse(trimmed) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid YAML";
    const bunLine =
      error instanceof Error && typeof (error as Error & { line?: unknown }).line === "number"
        ? (error as Error & { line: number }).line
        : undefined;
    const heuristicLine = inferLineFromStructure(trimmed);
    const line =
      heuristicLine > 1
        ? heuristicLine
        : bunLine ??
          (() => {
            const positionMatch = message.match(/position\s+(\d+)/i);
            return positionMatch
              ? lineFromPosition(trimmed, Number(positionMatch[1]))
              : 1;
          })();
    throw new YamlParseError(`YAML parse error: ${message}`, line);
  }
};

export const stringifyYaml = (value: unknown): string =>
  `${bunYaml ? bunYaml.stringify(value) : JSON.stringify(value, null, 2)}\n`;
