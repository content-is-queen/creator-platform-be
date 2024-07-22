const cron = require("node-cron");
const { AdminController } = require("../restful/controllers/adminController");
const {
  OpportunitiesController,
} = require("../restful/controllers/opportunitiesController");

const cronJob = () => {
  cron.schedule("0 0 1 * *", () => {
    AdminController.resetAllUsersLimit();
  });

  cron.schedule("0 0 * * *", () => {
    OpportunitiesController.deleteExpiredOpportunities();
  });
};

module.exports = cronJob;
