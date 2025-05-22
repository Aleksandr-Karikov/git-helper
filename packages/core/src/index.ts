import {
  getGitDiff,
  getUntrackedFiles,
  gitAddFiles,
  createCommit,
  generateDiffForNewFiles,
  Commit,
} from './git/index.js';
import { DiffAnalyzer } from './llm/index.js';
import { LLMConfig } from './types.js';
export * from './types.js';

export async function getProposedCommits(config: LLMConfig) {
  const gitDiff = getGitDiff();
  const newFiles = getUntrackedFiles();

  const newFilesDiff = await generateDiffForNewFiles(newFiles);

  const combinedDiff = gitDiff + '\n' + newFilesDiff;

  const commits = await DiffAnalyzer.analyzeGitDiff(combinedDiff, config);
  return commits;
}

export async function applyCommits(commits: Commit[]) {
  for (const commit of commits) {
    gitAddFiles(commit.files);

    const message = `${commit.title}\n\n${commit.description}`;
    createCommit(message);
  }
}
