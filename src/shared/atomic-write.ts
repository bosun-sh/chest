import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { newId } from "./ids";

export const atomicWriteText = async (
  filePath: string,
  contents: string,
): Promise<void> => {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });

  const tempPath = join(directory, `.chest-${newId()}.tmp`);
  await writeFile(tempPath, contents, "utf8");
  await rename(tempPath, filePath);
};
