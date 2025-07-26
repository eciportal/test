/**
 * This is the backend code that will run on Firebase Cloud Functions.
 * It automatically sends a notification when a new document is added
 * to the 'announcements' collection in Firestore.
 */

// Import the required Firebase modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function that triggers when a new announcement is created.
 *
 * @name sendNotificationOnNewAnnouncement
 * @type {functions.CloudFunction}
 */
exports.sendNotificationOnNewAnnouncement = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(async (snapshot, context) => {
    // 1. Get the new announcement data
    const announcement = snapshot.data();
    const announcementTitle = announcement.title;
    const announcementMessage = announcement.message;

    console.log(`New announcement created: "${announcementTitle}". Preparing to send notifications.`);

    // 2. Prepare the notification payload
    // This is the message that will be sent to the devices.
    const payload = {
      notification: {
        title: `New Announcement: ${announcementTitle}`,
        body: announcementMessage,
        icon: "https://placehold.co/192x192/4f46e5/ffffff?text=E", // Optional: URL to an icon
        click_action: "/", // URL to open when the notification is clicked
      },
    };

    // 3. Fetch all FCM registration tokens from the 'fcmTokens' collection
    try {
      const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();

      if (tokensSnapshot.empty) {
        console.log("No device tokens found. No notifications sent.");
        return null;
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
      console.log(`Found ${tokens.length} device tokens to send to.`);

      // 4. Send the notification to all collected tokens
      // sendToDevice is efficient for sending to multiple tokens.
      const response = await admin.messaging().sendToDevice(tokens, payload);

      // 5. Optional: Clean up invalid tokens
      // It's good practice to remove tokens that are no longer valid.
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error(
            "Failure sending notification to",
            tokens[index],
            error,
          );
          // Check for common errors indicating an invalid or unregistered token
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            // Add the document ID of the invalid token to the removal list
            tokensToRemove.push(tokensSnapshot.docs[index].id);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        console.log(`Cleaning up ${tokensToRemove.length} invalid tokens.`);
        const promises = tokensToRemove.map((docId) =>
          admin.firestore().collection("fcmTokens").doc(docId).delete(),
        );
        await Promise.all(promises);
      }

      console.log("Notifications sent successfully.");
      return {success: true};
    } catch (error) {
      console.error("Error sending notifications:", error);
      return {success: false, error: error.message};
    }
  });
