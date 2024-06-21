// contractRoutes.js
const { Router } = require("express");
const { protect } = require("../../middleware");
const {
  NotificationsController,
} = require("../controllers/notificationController");

const router = Router();

router.post("/send", NotificationsController.sendNotification);
router.get("/all", protect, NotificationsController.getAllNotifications);
router.delete("/clear", protect, NotificationsController.clearAllNotifications);

module.exports.notificationsRouter = router;
