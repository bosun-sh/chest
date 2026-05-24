import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { atomicWriteText } from "../shared/atomic-write";
import { parseYaml, stringifyYaml } from "../shared/yaml-parse";

export const readArrayFile = async <T>(filePath: string): Promise<T[]> => {
  const contents = await readFile(filePath, "utf8");
  return parseYaml<T[]>(contents);
};

export const writeArrayFile = async <T>(
  filePath: string,
  items: T[],
): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true });
  await atomicWriteText(filePath, stringifyYaml(items));
};

export const upsertById = <T extends { id: string }>(
  items: T[],
  item: T,
): T[] => {
  const index = items.findIndex(({ id }) => id === item.id);
  if (index === -1) {
    return [...items, item];
  }

  const copy = items.slice();
  copy[index] = item;
  return copy;
};

export const removeById = <T extends { id: string }>(
  items: T[],
  id: string,
): T[] => items.filter((item) => item.id !== id);

export const findById = <T extends { id: string }>(
  items: T[],
  id: string,
): T | undefined => items.find((item) => item.id === id);
