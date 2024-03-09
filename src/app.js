import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccount from "../contentisqueen-97ae5-firebase-adminsdk-qhkbo-6886ee17eb.json";
import router from "./restful/routes";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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
