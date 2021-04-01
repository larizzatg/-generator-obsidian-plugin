"use strict";
const Generator = require("yeoman-generator");
const Octokit = require("@octokit/core").Octokit;
const isSemver = require("is-semver");

const octokit = new Octokit();

module.exports = class extends Generator {
  async prompting() {
    const obsidianPlugins = await this._getObsidianPlugins();
    const obsidianVersions = await this._getObsidianVersions();

    this.answers = await this.prompt([
      {
        type: "input",
        name: "id",
        message: "Id",
        validate: function(value) {
          if (!value) {
            return "Please enter a id";
          }

          const idExists = obsidianPlugins.some(
            plugin => plugin.id.toLowerCase() === value.toLowerCase()
          );
          return idExists
            ? "This id already exists, please enter another"
            : true;
        }
      },
      {
        type: "input",
        name: "name",
        message: "Name",
        validate: function(value) {
          if (!value) {
            return "Please enter a name";
          }

          const nameExists = obsidianPlugins.some(
            plugin => plugin.name.toLowerCase() === value.toLowerCase()
          );
          return nameExists
            ? "This name already exists, please enter another"
            : true;
        }
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
        default: "1.0.0",
        validate: function(value) {
          return isSemver(value)
            ? true
            : "The version should be a valid semver (only numbers, Mayor.Minor.Patch)";
        }
      },
      {
        type: "list",
        name: "minObsidianVersion",
        message: "Minimum Obsidian version required",
        choices: obsidianVersions,
        validate: function(value) {
          return value ? true : "Please select the minium obsidian version";
        }
      },
      {
        type: "input",
        name: "authorName",
        message: "Author's Name",
        validate: function(value) {
          return value ? true : "Please enter your name";
        }
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
        choices: ["yes", "no"]
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

  async _getObsidianPlugins() {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "obsidianmd",
        repo: "obsidian-releases",
        path: "community-plugins.json"
      }
    );

    const file = Array.isArray(data) ? data[0] || {} : data;

    if (file.content) {
      const buff = Buffer.from(file.content, "base64");
      return JSON.parse(buff.toString("utf8"));
    }

    return [];
  }

  default() {
    console.log(`is desktop only `, this.answers.pluginIsDesktopOnly);
  }
};
