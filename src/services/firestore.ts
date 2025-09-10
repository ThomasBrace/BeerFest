import { auth, db } from '../firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Attendee, Beer, Category, Event, Score } from '../types'
import { CATEGORIES, computeTotal } from '../types'

function generateEventCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

function nowMs(): number {
  return Date.now()
}

export async function createEvent(hostName: string, eventName: string) {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const code = generateEventCode()
  const eventRef = await addDoc(collection(db, 'events'), {
    code,
    name: eventName,
    hostId: user.uid,
    createdAt: nowMs(),
    status: 'active',
    beerOrder: [],
  } as Omit<Event, 'id'>)

  const event: Event = { id: eventRef.id, code, name: eventName, hostId: user.uid, createdAt: nowMs(), status: 'active', beerOrder: [] }

  const attendeeRef = await addDoc(collection(db, 'attendees'), {
    name: hostName,
    isHost: true,
    joinedAt: nowMs(),
    eventId: eventRef.id,
    userId: user.uid,
  })

  const attendee: Attendee & { eventId: string; userId: string } = {
    id: attendeeRef.id,
    name: hostName,
    isHost: true,
    joinedAt: nowMs(),
    eventId: eventRef.id,
    userId: user.uid,
  }

  return { event, attendee }
}

export async function joinEventByCode(eventCode: string, attendeeName: string) {
  // No authentication required for attendees - they can join freely
  
  const q = query(collection(db, 'events'), where('code', '==', eventCode), where('status', '==', 'active'))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) throw new Error('Event not found or not active')
  const eventDoc = snapshot.docs[0]
  const event = { id: eventDoc.id, ...(eventDoc.data() as Omit<Event, 'id'>) } as Event

  // Generate a unique attendee ID without requiring authentication
  const attendeeId = `attendee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const attendeeRef = await addDoc(collection(db, 'attendees'), {
    name: attendeeName,
    isHost: false,
    joinedAt: nowMs(),
    eventId: event.id,
    userId: attendeeId, // Use generated ID instead of auth user ID
  })

  const attendee: Attendee & { eventId: string; userId: string } = {
    id: attendeeRef.id,
    name: attendeeName,
    isHost: false,
    joinedAt: nowMs(),
    eventId: event.id,
    userId: attendeeId,
  }
  return { event, attendee }
}

export async function addOrUpdateBeer(eventId: string, beer: Omit<Beer, 'id' | 'eventId' | 'tasted'> & { id?: string }) {
  const base = {
    eventId,
    name: beer.name,
    brewery: beer.brewery,
    style: beer.style,
    broughtByAttendeeId: beer.broughtByAttendeeId,
    orderIndex: beer.orderIndex ?? null,
    tasted: false,
    photoUrl: beer.photoUrl ?? null,
  }

  if (beer.id) {
    await updateDoc(doc(db, 'beers', beer.id), base)
    return beer.id
  }
  const ref = await addDoc(collection(db, 'beers'), base)
  return ref.id
}

export async function listBeers(eventId: string) {
  const q = query(collection(db, 'beers'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Beer, 'id'>) })) as Beer[]
}

export async function listAttendees(eventId: string) {
  const q = query(collection(db, 'attendees'), where('eventId', '==', eventId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Array<{ id: string; name: string; isHost?: boolean }>
}

export async function randomizeBeerOrder(eventId: string) {
  const beers = await listBeers(eventId)
  const shuffled = [...beers]
    .map(b => ({ b, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((x, idx) => ({ ...x.b, orderIndex: idx }))
  // Persist orderIndex
  await Promise.all(shuffled.map(b => updateDoc(doc(db, 'beers', b.id), { orderIndex: b.orderIndex })))
  // Save to event.beerOrder for quick access
  await updateDoc(doc(db, 'events', eventId), { beerOrder: shuffled.map(b => b.id) })
  return shuffled
}

export async function markBeerTasted(beerId: string, tasted: boolean) {
  await updateDoc(doc(db, 'beers', beerId), { tasted })
}

export async function submitScore(args: {
  eventId: string
  beerId: string
  attendeeId: string
  values: Record<Category, number>
}) {
  const valuesFilled: Record<Category, number> = { ...CATEGORIES.reduce((o, c) => ({ ...o, [c]: 0 }), {} as Record<Category, number>), ...args.values }
  const total = computeTotal(valuesFilled)
  
  // Check if a score already exists for this attendee-beer combination
  const existingScoreQuery = query(
    collection(db, 'scores'),
    where('eventId', '==', args.eventId),
    where('beerId', '==', args.beerId),
    where('attendeeId', '==', args.attendeeId)
  )
  const existingSnap = await getDocs(existingScoreQuery)
  
  const scoreData = {
    eventId: args.eventId,
    beerId: args.beerId,
    attendeeId: args.attendeeId,
    values: valuesFilled,
    total,
    updatedAt: nowMs(),
  } as Omit<Score, 'id'>
  
  if (existingSnap.empty) {
    // Create new score
    const ref = await addDoc(collection(db, 'scores'), scoreData)
    return ref.id
  } else {
    // Update existing score
    const existingDoc = existingSnap.docs[0]
    await updateDoc(doc(db, 'scores', existingDoc.id), scoreData)
    return existingDoc.id
  }
}

export async function endEvent(eventId: string) {
  await updateDoc(doc(db, 'events', eventId), { status: 'ended' })
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const d = await getDoc(doc(db, 'events', eventId))
  if (!d.exists()) return null
  return { id: d.id, ...(d.data() as Omit<Event, 'id'>) }
}

export async function deleteBeer(eventId: string, beerId: string) {
  // Delete the beer document
  await deleteDoc(doc(db, 'beers', beerId))
  
  // Update the event's beerOrder to remove the deleted beer
  const event = await getEvent(eventId)
  if (event) {
    const updatedBeerOrder = event.beerOrder.filter(id => id !== beerId)
    await updateDoc(doc(db, 'events', eventId), { beerOrder: updatedBeerOrder })
  }
  
  // Delete all scores for this beer
  const scoresQuery = query(
    collection(db, 'scores'),
    where('eventId', '==', eventId),
    where('beerId', '==', beerId)
  )
  const scoresSnap = await getDocs(scoresQuery)
  await Promise.all(scoresSnap.docs.map(doc => deleteDoc(doc.ref)))
}

export function listenToEventStatus(eventId: string, callback: (event: Event | null) => void): () => void {
  const eventRef = doc(db, 'events', eventId)
  return onSnapshot(eventRef, (doc) => {
    if (doc.exists()) {
      const event = { id: doc.id, ...(doc.data() as Omit<Event, 'id'>) }
      callback(event)
    } else {
      callback(null)
    }
  })
}


