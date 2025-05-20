import fs from "fs";
import path from "path";

export async function generateDiffForNewFiles(
  files: string[]
): Promise<string> {
  let result = "";
  for (const file of files) {
    const content = await fs.promises.readFile(path.resolve(file), "utf-8");
    result += `\ndiff --git a/${file} b/${file}\n`;
    result += `new file mode 100644\n`;
    result += `--- /dev/null\n`;
    result += `+++ b/${file}\n`;
    content.split("\n").forEach((line) => {
      result += `+${line}\n`;
    });
  }
  return result;
}
