import express from "express";
import dotenv from "dotenv";
import cors from "cors";
const { initializeApp, cert } = require("firebase-admin/app");
import fileUploader from "express-fileupload";
import serviceAccount from "../contentisqueen-97ae5-firebase-adminsdk-qhkbo-6886ee17eb.json";
import router from "./restful/routes";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "contentisqueen-97ae5.appspot.com",
});
app.use(
  fileUploader({
    fileSize: 50 * 1024 * 1024,
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

app.use(router);
const start = () => {
  try {
    app.listen({ port: PORT }, () =>
      process.stdout.write(`http://localhost:${PORT} \n`),
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

start();
