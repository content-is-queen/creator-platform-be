const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const functions = require("firebase-functions");
const { initializeApp, cert } = require("firebase-admin/app");
const fileUploader = require("express-fileupload");
const router = require("./restful/routes");
const apiLogger = require("./helper/apiCallLog");
const serviceAccount = {
  "type": process.env.SERVICE_ACCOUNT_TYPE,
  "project_id": process.env.PROJECT_ID, // Corrected
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
};

dotenv.config();
const PORT = 5000;
const app = express();
app.use(cors());
app.use(express.json());
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "contentisqueen-97ae5.appspot.com",
});
app.use(apiLogger);
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
