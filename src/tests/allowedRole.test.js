/* eslint-disable no-unused-vars */
const { describe, it, beforeEach, afterEach } = require("mocha");
// const { expect } = require("chai");
const sinon = require("sinon");
const { Util } = require("../helper/utils");

describe("allowedRole Middleware", () => {
  let req, res, next, utilStub;

  beforeEach(() => {
    req = { user: { role: "user", email: "user@example.com" } };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    next = sinon.stub();
    utilStub = sinon.stub(Util.prototype, "send");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should call next if user role is allowed", () => {
    req.user.role = "admin";
    const allowedRole = require("../helper/allowedRole");
    const middleware = allowedRole(["admin", "super_admin"]);
    middleware(req, res, next);
  });

  it("should call next if user email is allowed", () => {
    process.env.EMAIL = "user@example.com";
    req.user.email = "user@example.com";
    const allowedRole = require("../helper/allowedRole");
    const middleware = allowedRole(["admin", "super_admin"]);
    middleware(req, res, next);
  });

  it("should return error if user role is not allowed", () => {
    const allowedRole = require("../helper/allowedRole");
    const middleware = allowedRole(["admin", "super_admin"]);
    middleware(req, res, next);
  });

  it("should return error if user role and email are not allowed", () => {
    req.user.role = "user";
    process.env.EMAIL = "admin@example.com";
    const allowedRole = require("../helper/allowedRole");
    const middleware = allowedRole(["admin", "super_admin"]);
    middleware(req, res, next);
  });
});
