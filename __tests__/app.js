"use strict";
const path = require("path");
// Comment this until learn to test
// const assert = require("yeoman-assert");
const helpers = require("yeoman-test");

describe("generator-obsidian-plugin:app", () => {
  beforeAll(() => {
    return helpers
      .run(path.join(__dirname, "../generators/app"))
      .withPrompts({ someAnswer: true });
  });
});
