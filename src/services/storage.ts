import { storage } from '../firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

export async function uploadBeerPhoto(eventId: string, beerId: string, file: File): Promise<string> {
  const key = `events/${eventId}/beers/${beerId}/${Date.now()}-${file.name}`
  const r = ref(storage, key)
  const snap = await uploadBytes(r, file, { contentType: file.type })
  const url = await getDownloadURL(snap.ref)
  return url
}


