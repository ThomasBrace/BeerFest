#!/usr/bin/env node

/**
 * Manual cleanup script for old BeerFestify events
 * Run this script to manually clean up events older than 1 week
 * 
 * Usage: node cleanup-script.js
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

// Initialize Firebase Admin (you'll need to set GOOGLE_APPLICATION_CREDENTIALS)
initializeApp();
const db = getFirestore();
const storage = getStorage();

async function cleanupOldEvents() {
  console.log('🧹 Starting manual cleanup of old events...');
  
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    console.log(`📅 Looking for events older than: ${oneWeekAgo.toISOString()}`);
    
    // Find events older than 1 week
    const eventsSnapshot = await db.collection("events")
      .where("createdAt", "<", oneWeekAgo)
      .get();
    
    console.log(`🔍 Found ${eventsSnapshot.size} old events to clean up`);
    
    if (eventsSnapshot.size === 0) {
      console.log('✅ No old events found. Database is clean!');
      return;
    }
    
    let deletedEvents = 0;
    let deletedBeers = 0;
    let deletedScores = 0;
    let deletedAttendees = 0;
    let deletedPhotos = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();
      console.log(`🗑️  Cleaning up event: ${eventData.name || eventId}`);
      
      // Delete all related data
      const batch = db.batch();
      
      // Delete beers
      const beersSnapshot = await db.collection("beers")
        .where("eventId", "==", eventId)
        .get();
      
      console.log(`  🍺 Deleting ${beersSnapshot.size} beers...`);
      
      for (const beerDoc of beersSnapshot.docs) {
        const beer = beerDoc.data();
        
        // Delete beer photos from storage
        if (beer.photoUrl) {
          try {
            const photoRef = storage.bucket().file(beer.photoUrl.split('/o/')[1]?.split('?')[0]);
            await photoRef.delete();
            deletedPhotos++;
            console.log(`    📸 Deleted photo for beer: ${beer.name}`);
          } catch (error) {
            console.warn(`    ⚠️  Failed to delete photo for beer ${beerDoc.id}:`, error.message);
          }
        }
        
        batch.delete(beerDoc.ref);
        deletedBeers++;
      }
      
      // Delete scores
      const scoresSnapshot = await db.collection("scores")
        .where("eventId", "==", eventId)
        .get();
      
      console.log(`  ⭐ Deleting ${scoresSnapshot.size} scores...`);
      
      for (const scoreDoc of scoresSnapshot.docs) {
        batch.delete(scoreDoc.ref);
        deletedScores++;
      }
      
      // Delete attendees
      const attendeesSnapshot = await db.collection("attendees")
        .where("eventId", "==", eventId)
        .get();
      
      console.log(`  👥 Deleting ${attendeesSnapshot.size} attendees...`);
      
      for (const attendeeDoc of attendeesSnapshot.docs) {
        batch.delete(attendeeDoc.ref);
        deletedAttendees++;
      }
      
      // Delete the event itself
      batch.delete(eventDoc.ref);
      deletedEvents++;
      
      // Commit the batch
      await batch.commit();
      console.log(`  ✅ Event cleaned up successfully`);
    }
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`  - Events deleted: ${deletedEvents}`);
    console.log(`  - Beers deleted: ${deletedBeers}`);
    console.log(`  - Scores deleted: ${deletedScores}`);
    console.log(`  - Attendees deleted: ${deletedAttendees}`);
    console.log(`  - Photos deleted: ${deletedPhotos}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOldEvents()
  .then(() => {
    console.log('\n✨ Manual cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
