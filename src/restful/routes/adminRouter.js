const { Router } = require("express");
const { AdminController } = require("../controllers/adminController");
const { protect } = require("../../middleware/index");
const { default: allowedRole } = require("../../helper/allowedRole");


const router = Router();

const rateLimit = require('express-rate-limit');

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting middleware to all routes in the applications router
router.use(limiter);


router.post("/users",protect,allowedRole(["admin"]), AdminController.adminCreateUser);
router.get("/users",protect,allowedRole(["admin"]),  AdminController.admingetAllUsers);

module.exports.adminRouter = router;
