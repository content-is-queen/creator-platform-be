const admin = require("firebase-admin");

async function sendNotification({ token, title, body, userId }) {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });
    const notificationData = {
      title,
      body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .add(notificationData);

    return {
      statusCode: 200,
      message: "Notification sent successfully",
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: error.message || "Failed to send notification",
    };
  }
}

module.exports = sendNotification;
