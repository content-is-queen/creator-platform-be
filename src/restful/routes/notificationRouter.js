// contractRoutes.js
const { Router } = require("express");
const {
  NotificationsController,
} = require("../controllers/notificationController");
const { protect } = require("../../middleware");

const router = Router();

router.post("/send", NotificationsController.sendNotification);
router.post("/save", NotificationsController.saveFcmToken);
router.get("/all", protect, NotificationsController.getAllNotifications);
router.delete("/clear", protect, NotificationsController.clearAllNotifications);

module.exports.notificationsController = router;
