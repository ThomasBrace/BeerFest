import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import {onSchedule} from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Scheduled function to clean up old events (runs daily at 2 AM UTC)
export const cleanupOldEvents = onSchedule("0 2 * * *", async (event) => {
  logger.info("Starting cleanup of old events...");
  
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Find events older than 1 week
    const eventsSnapshot = await db.collection("events")
      .where("createdAt", "<", oneWeekAgo)
      .get();
    
    logger.info(`Found ${eventsSnapshot.size} old events to clean up`);
    
    let deletedEvents = 0;
    let deletedBeers = 0;
    let deletedScores = 0;
    let deletedAttendees = 0;
    let deletedPhotos = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      logger.info(`Cleaning up event: ${eventId}`);
      
      // Delete all related data
      const batch = db.batch();
      
      // Delete beers
      const beersSnapshot = await db.collection("beers")
        .where("eventId", "==", eventId)
        .get();
      
      for (const beerDoc of beersSnapshot.docs) {
        const beer = beerDoc.data();
        
        // Delete beer photos from storage
        if (beer.photoUrl) {
          try {
            const photoRef = storage.bucket().file(beer.photoUrl.split('/o/')[1]?.split('?')[0]);
            await photoRef.delete();
            deletedPhotos++;
          } catch (error) {
            logger.warn(`Failed to delete photo for beer ${beerDoc.id}:`, error);
          }
        }
        
        batch.delete(beerDoc.ref);
        deletedBeers++;
      }
      
      // Delete scores
      const scoresSnapshot = await db.collection("scores")
        .where("eventId", "==", eventId)
        .get();
      
      for (const scoreDoc of scoresSnapshot.docs) {
        batch.delete(scoreDoc.ref);
        deletedScores++;
      }
      
      // Delete attendees
      const attendeesSnapshot = await db.collection("attendees")
        .where("eventId", "==", eventId)
        .get();
      
      for (const attendeeDoc of attendeesSnapshot.docs) {
        batch.delete(attendeeDoc.ref);
        deletedAttendees++;
      }
      
      // Delete the event itself
      batch.delete(eventDoc.ref);
      deletedEvents++;
      
      // Commit the batch
      await batch.commit();
    }
    
    logger.info(`Cleanup completed:`, {
      deletedEvents,
      deletedBeers,
      deletedScores,
      deletedAttendees,
      deletedPhotos
    });
    
  } catch (error) {
    logger.error("Error during cleanup:", error);
  }
});

// Manual cleanup function (can be called via HTTP)
export const manualCleanup = onRequest(async (req, res) => {
  logger.info("Manual cleanup triggered");
  
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const eventsSnapshot = await db.collection("events")
      .where("createdAt", "<", oneWeekAgo)
      .get();
    
    let deletedEvents = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      
      // Delete all related data
      const batch = db.batch();
      
      // Delete beers
      const beersSnapshot = await db.collection("beers")
        .where("eventId", "==", eventId)
        .get();
      
      for (const beerDoc of beersSnapshot.docs) {
        batch.delete(beerDoc.ref);
      }
      
      // Delete scores
      const scoresSnapshot = await db.collection("scores")
        .where("eventId", "==", eventId)
        .get();
      
      for (const scoreDoc of scoresSnapshot.docs) {
        batch.delete(scoreDoc.ref);
      }
      
      // Delete attendees
      const attendeesSnapshot = await db.collection("attendees")
        .where("eventId", "==", eventId)
        .get();
      
      for (const attendeeDoc of attendeesSnapshot.docs) {
        batch.delete(attendeeDoc.ref);
      }
      
      // Delete the event itself
      batch.delete(eventDoc.ref);
      deletedEvents++;
      
      await batch.commit();
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedEvents} old events`,
      deletedEvents
    });
    
  } catch (error) {
    logger.error("Error during manual cleanup:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
