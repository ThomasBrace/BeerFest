import { useState, useEffect } from 'react'
import { joinEventByCode, addOrUpdateBeer } from '../services/firestore'
import { uploadBeerPhoto } from '../services/storage'
import { saveSession } from '../session'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function JoinEvent() {
  const [searchParams] = useSearchParams()
  const [eventCode, setEventCode] = useState('')
  const [name, setName] = useState('')
  const [beerName, setBeerName] = useState('')
  const [beerBrewery, setBeerBrewery] = useState('')
  const [beerStyle, setBeerStyle] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Handle QR code URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setEventCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!eventCode.trim() || !name.trim()) return setError('Enter event code and your name')
    if (!beerName.trim()) return setError('Enter your beer name')
    setLoading(true)
    try {
      const { event, attendee } = await joinEventByCode(eventCode.trim().toUpperCase(), name.trim())
      
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
      
      saveSession({ eventId: event.id, eventCode: event.code, eventName: event.name, attendeeId: attendee.id, attendeeName: attendee.name, isHost: false })
      navigate('/score')
    } catch (err: any) {
      setError(err.message ?? 'Failed to join event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-app">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Festival</h1>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span>👥</span>
            <h2 className="text-xl font-semibold">Enter Festival Details</h2>
          </div>
          <p className="text-gray-600 mb-6">Enter the festival code provided by the organizer and your name</p>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Festival Code</label>
              <input className="input" placeholder="e.g., ABC123" value={eventCode} onChange={e => setEventCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="input" placeholder="Enter your name as registered" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Register your beer</label>
              <input className="input" placeholder="Beer name" value={beerName} onChange={e => setBeerName(e.target.value)} />
              <input className="input mt-2" placeholder="Brewery (optional)" value={beerBrewery} onChange={e => setBeerBrewery(e.target.value)} />
              <input className="input mt-2" placeholder="Style (optional)" value={beerStyle} onChange={e => setBeerStyle(e.target.value)} />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Beer Photo (optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Joining…' : 'Join Festival'}</button>
          </form>
        </div>
        
        <p className="text-sm text-gray-500 text-center mt-6">Don't have a festival code? Ask the organizer to share it with you.</p>
      </div>
    </div>
  )
}


