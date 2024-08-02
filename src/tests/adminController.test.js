/* eslint-disable no-prototype-builtins */
const assert = require("assert");
const { describe, it } = require("mocha");
const { AdminController } = require("../restful/controllers/adminController");

describe("AdminController", () => {
  describe("adminCreateUser", () => {
    it("It should have createUser function", () => {
      assert.strictEqual(typeof AdminController.adminCreateUser, "function");
    });
  });

  describe("adminActivateUser", () => {
    it("It should have createUser function", () => {
      assert.strictEqual(typeof AdminController.adminActivateUser, "function");
    });
  });
});
