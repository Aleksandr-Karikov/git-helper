import { LLMConfig } from "./config.js";
import {
  getGitDiff,
  getUntrackedFiles,
  gitAddFiles,
  createCommit,
} from "./git.js";
import { generateDiffForNewFiles } from "./lib.js";
import { analyzeGitDiff, Commit } from "./llm.js";

export { type LLMConfig } from "./config.js";

export async function getProposedCommits(config: LLMConfig) {
  const gitDiff = getGitDiff();
  const newFiles = getUntrackedFiles();

  const newFilesDiff = await generateDiffForNewFiles(newFiles);

  const combinedDiff = gitDiff + "\n" + newFilesDiff;
  const commits = await analyzeGitDiff(combinedDiff, config);
  return commits;
}

export async function applyCommits(commits: Commit[]) {
  for (const commit of commits) {
    gitAddFiles(commit.files);

    const message = `${commit.title}\n\n${commit.description}`;
    createCommit(message);
  }
}
