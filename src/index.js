const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const functions = require("firebase-functions");
const { initializeApp, cert } = require("firebase-admin/app");
const fileUploader = require("express-fileupload");
const serviceAccount = require("../contentisqueen-97ae5-firebase-adminsdk-qhkbo-6886ee17eb.json");
const router = require("./restful/routes");

dotenv.config();
const PORT = 5000;
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
    app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

start();

exports.api = functions.https.onRequest(app);
