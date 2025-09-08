import { useEffect, useState } from 'react'
import { clearSession, loadSession } from '../session'
import { endEvent, listBeers, randomizeBeerOrder, listenToEventStatus, listAttendees } from '../services/firestore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Beer, Attendee, Score } from '../types'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

export default function Host() {
  const navigate = useNavigate()
  const session = loadSession()
  const [beers, setBeers] = useState<Beer[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [joinUrl, setJoinUrl] = useState<string>('')
  const [copySuccess, setCopySuccess] = useState<string>('')

  useEffect(() => {
    if (!session?.isHost) {
      navigate('/')
      return
    }
    refresh()
    generateQRCode()

    // Listen for event status changes (in case event is ended from another device)
    const unsubscribe = listenToEventStatus(session.eventId, (event) => {
      if (event && event.status === 'ended') {
        navigate('/results')
      }
    })

    return () => unsubscribe()
  }, [session, navigate])

  async function refresh() {
    if (!session) return
    const data = await listBeers(session.eventId)
    setBeers(data.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999)))
    
    // Load attendees
    const attendeesData = await listAttendees(session.eventId)
    setAttendees(attendeesData as Attendee[])
    
    // Load all scores for this event
    const scoresQuery = query(collection(db, 'scores'), where('eventId', '==', session.eventId))
    const scoresSnap = await getDocs(scoresQuery)
    const scoresData = scoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Score[]
    setScores(scoresData)
  }

  async function generateQRCode() {
    if (!session?.eventCode) return
    
    try {
      const url = `${window.location.origin}/join?code=${session.eventCode}`
      setJoinUrl(url)
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  async function onRandomize() {
    if (!session) return
    setLoading(true)
    await randomizeBeerOrder(session.eventId)
    await refresh()
    setLoading(false)
  }

  async function onEndEvent() {
    if (!session) return
    await endEvent(session.eventId)
    navigate('/results')
  }

  function onLogout() {
    clearSession()
    navigate('/')
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopySuccess('Copied!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopySuccess('Failed to copy')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  const eventCode = session?.eventCode ?? ''

  // Helper function to check if an attendee has scored a beer
  function hasScored(attendeeId: string, beerId: string): boolean {
    return scores.some(score => score.attendeeId === attendeeId && score.beerId === beerId)
  }

  // Get completion stats
  const totalPossibleScores = attendees.length * beers.length
  const actualScores = scores.length
  const completionPercentage = totalPossibleScores > 0 ? Math.round((actualScores / totalPossibleScores) * 100) : 0

  return (
    <div className="container-app">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Host Panel</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="badge badge-green">Code: {eventCode}</span>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span>📱</span>
            <h2 className="text-xl font-semibold">Share Event</h2>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">Share this QR code with attendees to make joining easy!</p>
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-3">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code to join event" 
                  className="border border-gray-200 rounded-lg"
                />
                <p className="text-sm text-gray-500">
                  Scan to join event: <span className="font-mono font-semibold">{eventCode}</span>
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Or share the direct link:</p>
            {joinUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    className="flex-1 text-sm font-mono bg-transparent border-none outline-none text-gray-700"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn btn-secondary text-sm px-3 py-1"
                  >
                    {copySuccess || 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Click copy to share this link via text, email, or social media
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span>⚙️</span>
            <h2 className="text-xl font-semibold">Event Management</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" disabled={loading} onClick={onRandomize}>Randomize Order</button>
              <button type="button" className="btn btn-danger flex-1" onClick={onEndEvent}>End Event</button>
            </div>
            <button className="btn btn-primary w-full" onClick={() => navigate('/score')}>Score Beers</button>
            <button className="btn btn-secondary w-full" onClick={onLogout}>Leave Event</button>
          </div>
        </div>
        
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span>📊</span>
            <h2 className="text-xl font-semibold">Scoring Progress</h2>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-semibold">{actualScores}/{totalPossibleScores} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {attendees.length > 0 && beers.length > 0 && (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header row */}
                <div className="flex border-b border-gray-200 pb-2 mb-2">
                  <div className="w-20 flex-shrink-0 text-xs font-medium text-gray-600">Attendee</div>
                  {beers.map(beer => (
                    <div key={beer.id} className="w-12 text-center text-xs font-medium text-gray-600" title={beer.name}>
                      <div className="truncate">
                        {beer.orderIndex !== undefined ? `${beer.orderIndex + 1}.` : '?'}
                      </div>
                      <div className="truncate text-xs text-gray-500 mt-1">
                        {beer.name.length > 8 ? beer.name.substring(0, 8) + '...' : beer.name}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Data rows */}
                {attendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center border-b border-gray-100 py-1">
                    <div className="w-20 flex-shrink-0 text-xs font-medium text-gray-800 truncate">
                      {attendee.name}
                    </div>
                    {beers.map(beer => (
                      <div key={beer.id} className="w-12 text-center">
                        <div 
                          className={`w-4 h-4 mx-auto rounded-full ${
                            hasScored(attendee.id, beer.id) 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                          }`}
                          title={`${attendee.name} ${hasScored(attendee.id, beer.id) ? 'has scored' : 'has not scored'} ${beer.name}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Scored</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Not scored</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Beer List</h2>
          <ol className="space-y-2">
            {beers.map(b => (
              <li key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                {b.photoUrl && <img src={b.photoUrl} alt="Beer" className="w-10 h-10 object-cover rounded" />}
                <div className="flex-1">
                  <div className="font-medium">{b.name}</div>
                  <div className="text-sm text-gray-600">{b.brewery} — {b.style}</div>
                </div>
                {b.tasted ? <span className="badge badge-green">tasted</span> : <span className="badge badge-orange">pending</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}


