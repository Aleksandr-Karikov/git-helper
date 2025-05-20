import * as vscode from "vscode";
// import { analyzeGitDiff } from "@git-helper/core";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "git-helper.analyze",
    () => {
      const diff = "Example diff data"; // Заменим на реальный git diff
      // const commits = analyzeGitDiff(diff);
      // vscode.window.showInformationMessage(`Commits: ${commits.join(", ")}`);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
