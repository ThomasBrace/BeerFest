import { useState } from 'react'
import { createEvent, addOrUpdateBeer } from '../services/firestore'
import { uploadBeerPhoto } from '../services/storage'
import { saveSession } from '../session'
import { useNavigate } from 'react-router-dom'
import { ensureAnonymousAuth } from '../firebase'
import { Settings, Beer } from 'lucide-react'

export default function CreateEvent() {
  const [hostName, setHostName] = useState('')
  const [eventName, setEventName] = useState('')
  const [beerName, setBeerName] = useState('')
  const [beerBrewery, setBeerBrewery] = useState('')
  const [beerStyle, setBeerStyle] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!hostName.trim() || !eventName.trim()) return setError('Enter host and event name')
    if (!beerName.trim()) return setError('Enter your beer name')
    setLoading(true)
    try {
      // Authenticate only when creating events (for hosts)
      await ensureAnonymousAuth()
      
      const { event, attendee } = await createEvent(hostName.trim(), eventName.trim())
      const beerId = await addOrUpdateBeer(event.id, {
        name: beerName.trim(),
        brewery: beerBrewery.trim(),
        style: beerStyle.trim(),
        broughtByAttendeeId: attendee.id,
      })
      if (photoFile) {
        const url = await uploadBeerPhoto(event.id, beerId, photoFile)
        await addOrUpdateBeer(event.id, { id: beerId, name: beerName.trim(), brewery: beerBrewery.trim(), style: beerStyle.trim(), broughtByAttendeeId: attendee.id, photoUrl: url })
      }
      saveSession({ eventId: event.id, eventCode: event.code, eventName: event.name, attendeeId: attendee.id, attendeeName: attendee.name, isHost: true })
      navigate('/host')
    } catch (err: any) {
      setError(err.message ?? 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BeerFestify</h1>
          <p className="text-gray-600">Setup your home beer tasting event</p>
        </div>
        
        {/* Festival Setup Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Festival Setup</h2>
          </div>
          <p className="text-gray-600 mb-6">Create your festival - attendees will join using the festival code</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="input" placeholder="e.g., John Smith" value={hostName} onChange={e => setHostName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Festival Name</label>
              <input className="input" placeholder="e.g., Summer Beer Fest 2024" value={eventName} onChange={e => setEventName(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Beer Information Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Beer className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Register Your Beer</h2>
          </div>
          <p className="text-gray-600 mb-6">Tell us about the beer you're bringing to the festival</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beer Name</label>
              <input className="input" placeholder="Beer name" value={beerName} onChange={e => setBeerName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brewery (optional)</label>
              <input className="input" placeholder="Brewery name" value={beerBrewery} onChange={e => setBeerBrewery(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Style (optional)</label>
              <input className="input" placeholder="e.g., IPA, Stout, Lager" value={beerStyle} onChange={e => setBeerStyle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beer Photo (optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <form onSubmit={onSubmit}>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Creating…' : 'Create Festival'}</button>
        </form>
        
        <p className="text-sm text-gray-500 text-center">After creating the festival, share the code with attendees so they can join</p>
      </div>
    </div>
  )
}


