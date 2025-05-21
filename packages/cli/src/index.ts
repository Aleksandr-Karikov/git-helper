import readline from "readline";
import { getProposedCommits, applyCommits, LLMConfig } from "@git-helper/core";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

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

export async function getLLMConfig(): Promise<LLMConfig> {
  const argv = await yargs(hideBin(process.argv))
    .option("endpoint", {
      type: "string",
      description: "LLM endpoint URL",
      demandOption: true,
    })
    .option("apiKey", {
      type: "string",
      description: "API key for LLM",
      demandOption: true,
    })
    .option("model", {
      type: "string",
      default: "meta-llama/Meta-Llama-3.3-70B-Instruct",
      description: "Model name",
    })
    .option("language", {
      type: "string",
      default: "en",
      description: "Language of the commit messages",
    })
    .help()
    .alias("help", "h")
    .parse();

  return {
    endpoint: argv.endpoint,
    apiKey: argv.apiKey,
    model: argv.model,
    language: argv.language as "en" | "ru",
  };
}
async function main() {
  try {
    const commits = await getProposedCommits(await getLLMConfig());

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
