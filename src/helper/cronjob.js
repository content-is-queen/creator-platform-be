import cron from "node-cron";
import { AdminController } from "../restful/controllers/adminController";

export const cronJob = () => {
  cron.schedule("0 0 1 * *", () => {
    AdminController.resetAllUsersLimit();
  });
};
