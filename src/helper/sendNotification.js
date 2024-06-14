const admin = require('firebase-admin');

async function sendNotification({ token, title, body, user_id }) {
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
    await admin.firestore()
      .collection("users")
      .doc(user_id)
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
