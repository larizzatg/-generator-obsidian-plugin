"use strict";
const Generator = require("yeoman-generator");
const Octokit = require("@octokit/core").Octokit;
const isSemver = require("is-semver");
const pascalCase = require("pascal-case").pascalCase;
const _ = require("lodash");

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
        message: "Description",
        default: ""
      },
      {
        type: "input",
        name: "version",
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

  _generatePackageJson() {
    // Re-read the current package.json in case a composed generator already modified it
    const currentPkg = this.fs.readJSON(
      this.destinationPath("package.json"),
      {}
    );

    const pkg = _.merge(
      {
        name: this.answers.id,
        version: this.answers.version,
        description: this.answers.description,
        main: "main.js",
        scripts: {
          dev: "rollup --config rollup.config.js -w",
          build: "rollup --config rollup.config.js"
        },
        keywords: ["obsidian", "obsidian-plugin"],
        author: this.answers.authorName,
        license: "MIT",
        devDependencies: {
          "@rollup/plugin-commonjs": "^15.1.0",
          "@rollup/plugin-node-resolve": "^9.0.0",
          "@rollup/plugin-typescript": "^6.0.0",
          "@types/node": "^14.14.2",
          obsidian: "https://github.com/obsidianmd/obsidian-api/tarball/master",
          rollup: "^2.32.1",
          tslib: "^2.0.3",
          typescript: "^4.0.3"
        }
      },
      currentPkg
    );

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath("package.json"), pkg);
  }

  _generateManifest() {
    // Re-read the current manifest.json in case a composed generator already modified it
    const currentManifest = this.fs.readJSON(
      this.destinationPath("manifest.json"),
      {}
    );

    const manifest = _.merge(
      {
        id: this.answers.id,
        name: this.answers.name,
        version: this.answers.version,
        minAppVersion: this.answers.minObsidianVersion,
        description: this.answers.description,
        author: this.answers.authorName,
        authorUrl: this.answers.authorHomepage,
        isDesktopOnly: this.answers.pluginIsDesktopOnly === "yes"
      },
      currentManifest
    );

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath("manifest.json"), manifest);
  }

  _generateVersions() {
    // Re-read the current manifest.json in case a composed generator already modified it
    const currentVersions = this.fs.readJSON(
      this.destinationPath("versions.json"),
      {}
    );

    const version = _.merge(
      {
        [this.answers.version]: this.answers.minObsidianVersion
      },
      currentVersions
    );

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath("versions.json"), version);
  }

  _copyTemplates() {
    this.fs.copyTpl(
      this.templatePath("rollup.config"),
      this.destinationPath("rollup.config.js")
    );
    this.fs.copyTpl(
      this.templatePath("gitignore"),
      this.destinationPath(".gitignore")
    );
    this.fs.copyTpl(
      this.templatePath("README.md"),
      this.destinationPath("README.md")
    );
    this.fs.copyTpl(
      this.templatePath("tsconfig"),
      this.destinationPath("tsconfig.json")
    );
    this.fs.copyTpl(
      this.templatePath("main"),
      this.destinationPath("main.ts"),
      {
        className: pascalCase(this.answers.id)
      }
    );
  }

  writing() {
    this._generatePackageJson();
    this._generateManifest();
    this._generateVersions();
    this._copyTemplates();
  }

  installing() {
    this.npmInstall();
  }
};
