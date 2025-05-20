import {
  getGitDiff,
  getUntrackedFiles,
  gitAddFiles,
  createCommit,
} from "./git.js";
import { analyzeGitDiff, Commit } from "./llm.js";

import fs from "fs";
import path from "path";

async function generateDiffForNewFiles(files: string[]): Promise<string> {
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

export async function getProposedCommits() {
  const gitDiff = getGitDiff();
  const newFiles = getUntrackedFiles();
  console.log("newFiles", newFiles);
  console.log("diffs", gitDiff);
  const newFilesDiff = await generateDiffForNewFiles(newFiles);

  const combinedDiff = gitDiff + "\n" + newFilesDiff;
  const commits = await analyzeGitDiff(combinedDiff);
  return commits;
}

export async function applyCommits(commits: Commit[]) {
  for (const commit of commits) {
    const files = commit.files.map((f) => f.split("—")[0].trim());

    gitAddFiles(files);

    const message = `${commit.title}\n\n${commit.description}`;
    createCommit(message);
  }
}
