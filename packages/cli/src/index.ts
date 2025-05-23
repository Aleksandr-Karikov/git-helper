#!/usr/bin/env node

import readline from 'readline';
import { getProposedCommits, applyCommits, LLMConfig } from '@aktools/git-helper-core';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export async function getLLMConfig(): Promise<LLMConfig> {
  const argv = await yargs(hideBin(process.argv))
    .option('type', {
      type: 'string',
      choices: ['openai', 'llama', 'claude', 'mistral', 'custom'],
      default: 'llama',
      description: 'Type of LLM provider',
    })
    .option('endpoint', {
      type: 'string',
      description: 'LLM endpoint URL',
      demandOption: true,
    })
    .option('splitStrategy', {
      type: 'string',
      description: 'Split strategy, single or multiple commits for changes',
      choices: ['single', 'multiple'],
      default: 'single',
    })
    .option('apiKey', {
      type: 'string',
      description: 'API key for LLM',
      demandOption: true,
    })
    .option('model', {
      type: 'string',
      default: 'Qwen/QwQ-32B',
      description: 'Model name',
    })
    .option('language', {
      type: 'string',
      choices: ['en', 'ru'],
      default: 'en',
      description: 'Language of the commit messages',
    })
    .option('hiddenFiles', {
      type: 'array',
      string: true,
      description: 'List of lock files or regex patterns to hide from diff',
      default: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'pnpm-lock.yml', 'npm-shrinkwrap.json'],
    })
    .help()
    .alias('help', 'h')
    .parse();

  return {
    type: argv.type as LLMConfig['type'],
    endpoint: argv.endpoint,
    apiKey: argv.apiKey,
    model: argv.model,
    language: argv.language as LLMConfig['language'],
    hiddenFiles: argv.hiddenFiles,
  };
}

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
    const commits = await getProposedCommits(await getLLMConfig());

    if (commits.length === 0) {
      console.log('No commits proposed.');
      process.exit(0);
    }

    console.log('Proposed commits:');
    commits.forEach(({ title, description, files }, i) => {
      console.log(`\n${i + 1}. ${title}`);
      if (description) console.log(description);
      console.log(`files: \n${files.join(', ')}`);
    });

    const answer = await askQuestion('\nApply these commits? (y/n): ');

    if (answer === 'y' || answer === 'yes') {
      await applyCommits(commits);
      console.log('Commits applied.');
    } else {
      console.log('Aborted.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
