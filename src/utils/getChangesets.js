/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import fs from "fs-extra";
import path from "path";

import * as git from "./git";

export default async function getChangesets(changesetBase, sinceMasterOnly) {
  if (!fs.existsSync(changesetBase)) {
    throw new Error("There is no .changeset directory in this project");
  }

  const dirs = fs.readdirSync(changesetBase);
  // this needs to support just not dealing with dirs that aren't set up properly
  let changesets = dirs.filter(dir =>
    fs.lstatSync(path.join(changesetBase, dir)).isDirectory()
  );

  if (sinceMasterOnly) {
    const newChangesets = await git.getChangedChangesetFilesSinceMaster();
    const newHahses = newChangesets.map(c => c.split("/")[1]);

    changesets = changesets.filter(dir => newHahses.includes(dir));
  }

  const changesetContents = changesets.map(async changesetDir => {
    const summary = fs.readFileSync(
      path.join(changesetBase, changesetDir, "changes.md"),
      "utf-8"
    );
    const jsonPath = path.join(changesetBase, changesetDir, "changes.json");
    const json = require(jsonPath);
    const commit = await git.getCommitThatAddsFile(jsonPath);
    return { ...json, summary, commit, id: changesetDir };
  });
  return Promise.all(changesetContents);
}