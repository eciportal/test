/**
 * This is the backend code that will run on Firebase Cloud Functions.
 * It contains triggers for sending notifications for new announcements and new tests.
 */

// Import the required Firebase modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function that triggers when a new announcement is created.
 * Sends a notification to ALL users.
 */
exports.sendNotificationOnNewAnnouncement = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(async (snapshot, context) => {
    const announcement = snapshot.data();
    console.log(`New announcement: "${announcement.title}". Preparing to send notifications to all users.`);

    const payload = {
      notification: {
        title: `New Announcement: ${announcement.title}`,
        body: announcement.message,
        icon: "https://placehold.co/192x192/4f46e5/ffffff?text=E",
        click_action: "/",
      },
    };

    try {
      const allTokensSnapshot = await admin.firestore().collection("fcmTokens").get();
      if (allTokensSnapshot.empty) {
        console.log("No device tokens found.");
        return null;
      }

      const tokens = allTokensSnapshot.docs.map((doc) => doc.data().token);
      console.log(`Found ${tokens.length} total device tokens.`);
      
      // Send notifications and handle cleanup of invalid tokens
      await sendNotificationsAndCleanup(tokens, payload, allTokensSnapshot.docs);

      console.log("Announcement notifications sent successfully.");
      return { success: true };
    } catch (error) {
      console.error("Error sending announcement notifications:", error);
      return { success: false, error: error.message };
    }
  });


/**
 * Cloud Function that triggers when a new test is created.
 * Sends a notification ONLY to students in the target class.
 */
exports.sendNotificationOnNewTest = functions.firestore
  .document("tests/{testId}")
  .onCreate(async (snapshot, context) => {
    const test = snapshot.data();
    const targetClass = test.class;
    
    if (!targetClass) {
        console.log("Test created without a target class. No notification sent.");
        return null;
    }

    console.log(`New test "${test.title}" for Class ${targetClass}. Preparing notifications.`);

    const payload = {
        notification: {
            title: `New Test: ${test.title}`,
            body: `A new test has been assigned to your class (${targetClass}). Open the app to take it!`,
            icon: "https://placehold.co/192x192/4f46e5/ffffff?text=T",
            click_action: "/", 
        },
    };

    try {
        // 1. Find all students in the target class.
        const studentsQuery = admin.firestore().collection("students").where("course", "==", targetClass);
        const studentsSnapshot = await studentsQuery.get();

        if (studentsSnapshot.empty) {
            console.log(`No students found for class ${targetClass}. No notifications sent.`);
            return null;
        }

        const studentDocIds = studentsSnapshot.docs.map(doc => doc.id);
        console.log(`Found ${studentDocIds.length} students in Class ${targetClass}.`);
        
        // 2. Fetch the FCM tokens for those specific students.
        const tokensQuery = admin.firestore().collection("fcmTokens").where(admin.firestore.FieldPath.documentId(), 'in', studentDocIds);
        const tokensSnapshot = await tokensQuery.get();

        if (tokensSnapshot.empty) {
            console.log(`No device tokens found for students in class ${targetClass}.`);
            return null;
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        console.log(`Found ${tokens.length} device tokens for Class ${targetClass}.`);

        // 3. Send notifications and handle cleanup.
        await sendNotificationsAndCleanup(tokens, payload, tokensSnapshot.docs);

        console.log(`Notifications for test "${test.title}" sent successfully.`);
        return { success: true };
    } catch (error) {
        console.error(`Error sending notifications for test ${test.title}:`, error);
        return { success: false, error: error.message };
    }
});


/**
 * Helper function to send notifications and clean up invalid tokens.
 * @param {string[]} tokens - Array of FCM registration tokens.
 * @param {object} payload - The notification payload to send.
 * @param {admin.firestore.QueryDocumentSnapshot[]} tokenDocs - The original documents of the tokens.
 */
async function sendNotificationsAndCleanup(tokens, payload, tokenDocs) {
    // Note: sendToDevice has a limit of 1000 tokens per call.
    // For larger scale, you would need to batch these requests.
    const response = await admin.messaging().sendToDevice(tokens, payload);

    const tokensToRemove = [];
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error("Failure sending notification to", tokens[index], error);
            if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
            ) {
                // Get the document ID of the invalid token to delete it.
                tokensToRemove.push(tokenDocs[index].id);
            }
        }
    });

    if (tokensToRemove.length > 0) {
        console.log(`Cleaning up ${tokensToRemove.length} invalid tokens.`);
        const promises = tokensToRemove.map((docId) =>
            admin.firestore().collection("fcmTokens").doc(docId).delete()
        );
        await Promise.all(promises);
    }
}
