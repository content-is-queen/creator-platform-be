const { describe, it } = require("mocha");
const assert = require("assert");
const {
  NotificationsController,
} = require("../restful/controllers/notificationController");
describe("Notification controller", () => {
  describe("Get all notifications", () => {
    it("It should Get all notifications", () => {});

    it("should have getAllNotifications method", () => {
      assert.strictEqual(
        typeof NotificationsController.getAllNotifications,
        "function",
      );
    });
  });

  describe("Clear all notifications", () => {
    it("It should clear all notifications", async () => {});

    it("should have clearAllNotifications method", () => {
      assert.strictEqual(
        typeof NotificationsController.clearAllNotifications,
        "function",
      );
    });

    it("should handle missing userId gracefully", async () => {
      const req = {
        user: {},
      };
      const res = {
        statusCode: 0,
        body: null,
        status: function (code) {
          this.statusCode = code;
          return this;
        },
        json: function (body) {
          this.body = body;
          return this;
        },
      };
      await NotificationsController.clearAllNotifications(req, res);
      assert.strictEqual(res.statusCode, 500);
    });
  });
});
