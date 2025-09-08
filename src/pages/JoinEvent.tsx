import { useState, useEffect } from 'react'
import { joinEventByCode, addOrUpdateBeer } from '../services/firestore'
import { uploadBeerPhoto } from '../services/storage'
import { saveSession } from '../session'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, Beer, Trophy } from 'lucide-react'

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
    setLoading(true)
    try {
      const { event, attendee } = await joinEventByCode(eventCode.trim().toUpperCase(), name.trim())
      
      // Only add beer if beer name is provided
      if (beerName.trim()) {
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
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Festival</h1>
        </div>
        
        {/* Festival Code and Name Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Enter Festival Details</h2>
          </div>
          <p className="text-gray-600 mb-6">Enter the festival code provided by the organizer and your name</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Festival Code</label>
              <input className="input" placeholder="e.g., ABC123" value={eventCode} onChange={e => setEventCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="input" placeholder="Enter your name as registered" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Beer Information Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Beer className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Register Your Beer (Optional)</h2>
          </div>
          <p className="text-gray-600 mb-6">Tell us about the beer you're bringing to the festival, or leave blank to join as a taster only</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beer Name (optional)</label>
              <input className="input" placeholder="Leave blank if not bringing a beer" value={beerName} onChange={e => setBeerName(e.target.value)} />
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
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Joining…' : 'Join Festival'}</button>
        </form>
        
        <p className="text-sm text-gray-500 text-center mt-6">Don't have a festival code? Ask the organizer to share it with you. You can join to taste and score beers even if you don't bring one yourself!</p>
      </div>
    </div>
  )
}


