const { describe, it, before } = require("mocha");
const assert = require("assert");
const admin = require("firebase-admin");
const sendNotification = require("../helper/sendNotification"); // Adjust the path as necessary

describe("sendNotification Function", () => {
  before(() => {
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
      });
    }
  });

  it("should handle errors during notification sending", async () => {
    const token = "failToken";
    const title = "Test Title";
    const body = "Test Body";
    const userId = "testUserId";

    const result = await sendNotification({ token, title, body, userId });

    assert.strictEqual(result.statusCode, 500);
    assert.strictEqual(
      result.message,
      "The registration token is not a valid FCM registration token",
    );
  });

  it("should handle errors during Firestore save", async () => {
    const token = "testToken";
    const title = "Fail Title";
    const body = "Test Body";
    const userId = "testUserId";

    const result = await sendNotification({ token, title, body, userId });

    assert.strictEqual(result.statusCode, 500);
    assert.strictEqual(
      result.message,
      "The registration token is not a valid FCM registration token",
    );
  });
});
