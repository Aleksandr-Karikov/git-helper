import { execSync } from 'child_process';
export { generateDiffForNewFiles } from './utils.js';

export * from './types.js';

export function runGitCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Git command failed: ${command}\n${error.message}`);
    } else {
      throw new Error(`Git command failed: ${command}\nUnknown error: ${String(error)}`);
    }
  }
}

export function getGitDiff(): string {
  return runGitCommand('git diff --unified=0 --relative');
}

export function getUntrackedFiles(): string[] {
  const output = runGitCommand('git ls-files --others --exclude-standard');
  return output ? output.trim().split('\n').filter(Boolean) : [];
}

export function gitAddFiles(files: string[]): void {
  if (files.length === 0) return;
  const filesList = files.map((f) => `"${f}"`).join(' ');
  runGitCommand(`git add ${filesList}`);
}

export function createCommit(message: string): void {
  runGitCommand(`git commit -m "${escapeMessage(message)}"`);
}

function escapeMessage(msg: string): string {
  return msg.replace(/"/g, '\\"');
}
