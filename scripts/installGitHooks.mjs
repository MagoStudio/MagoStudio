#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const COMMITTED_HOOKS_DIRECTORY = ".githooks";

const runGit = (args) =>
  execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim();

const isInsideGitWorkTree = () => {
  try {
    return runGit(["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    return false;
  }
};

if (!isInsideGitWorkTree()) {
  process.exit(0);
}

runGit(["config", "core.hooksPath", COMMITTED_HOOKS_DIRECTORY]);
console.log(`Git hooks installed from ${COMMITTED_HOOKS_DIRECTORY}/`);
