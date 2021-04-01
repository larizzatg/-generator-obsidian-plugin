"use strict";
const Generator = require("yeoman-generator");
const Octokit = require("@octokit/core").Octokit;

const octokit = new Octokit();

module.exports = class extends Generator {
  async prompting() {
    const obsidianVersions = await this._getObsidianVersions();
    this.answers = await this.prompt([
      {
        type: "input",
        name: "id",
        message: "Id"
      },
      {
        type: "input",
        name: "name",
        message: "Name"
      },
      {
        type: "input",
        name: "description",
        message: "Description"
      },
      {
        type: "input",
        name: "pluginVersion",
        message: "version",
        default: "1.0.0"
      },
      {
        type: "list",
        name: "minObsidianVersion",
        message: "Minimum Obsidian version required",
        choices: obsidianVersions
      },
      {
        type: "input",
        name: "authorName",
        message: "Author's Name"
      },
      {
        type: "input",
        name: "authorHomepage",
        message: "Author's Homepage"
      },
      {
        type: "list",
        name: "pluginIsDesktopOnly",
        message: "Is desktop only?",
        choices: ["true", "false"]
      }
    ]);
  }

  async _getObsidianVersions() {
    const { data: releases = [] } = await octokit.request(
      "GET /repos/{owner}/{repo}/releases",
      {
        owner: "obsidianmd",
        repo: "obsidian-releases"
      }
    );
    const versions = releases
      .filter(
        release => release.prerelease === false && release.draft === false
      )
      .map(release => release.tag_name);
    return versions;
  }
};
