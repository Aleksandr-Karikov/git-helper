import readline from "readline";
import { getProposedCommits, applyCommits } from "@git-helper/core";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  try {
    const commits = await getProposedCommits();

    if (commits.length === 0) {
      console.log("No commits proposed.");
      process.exit(0);
    }

    console.log("Proposed commits:");
    commits.forEach(({ title, description, files }, i) => {
      console.log(`\n${i + 1}. ${title}`);
      if (description) console.log(description);
      console.log(`files: \n${files.join(", ")}`);
    });

    const answer = await askQuestion("\nApply these commits? (y/n): ");

    if (answer === "y" || answer === "yes") {
      await applyCommits(commits);
      console.log("Commits applied.");
    } else {
      console.log("Aborted.");
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
