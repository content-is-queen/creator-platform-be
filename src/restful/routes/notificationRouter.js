// contractRoutes.js
const { Router } = require("express");
const { NotificationsController } = require("../controllers/notificationController");

const router = Router();

router.post("/send", NotificationsController.sendNotification);
router.post("/save", NotificationsController.saveFcmToken );

module.exports.notificationsController = router;
