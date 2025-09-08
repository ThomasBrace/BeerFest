import { useEffect, useMemo, useState } from 'react'
import { loadSession } from '../session'
import { listAttendees, listBeers, submitScore, listenToEventStatus } from '../services/firestore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Beer, Category, Score } from '../types'
import { CATEGORIES } from '../types'
import { useNavigate } from 'react-router-dom'

export default function Score() {
  const navigate = useNavigate()
  const session = loadSession()
  const [beers, setBeers] = useState<Beer[]>([])
  const [activeBeerId, setActiveBeerId] = useState<string | null>(null)
  
  const [attendeeNameById, setAttendeeNameById] = useState<Record<string, string>>({})
  const [scoredBeerIds, setScoredBeerIds] = useState<Set<string>>(new Set())
  const [values, setValues] = useState<Record<Category, number>>({ look: 0, aroma: 0, flavour: 0, mouthfeel: 0, finish: 0 })
  const [scoredCategories, setScoredCategories] = useState<Set<Category>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Function to load existing score for current attendee and beer
  const loadExistingScore = async (beerId: string) => {
    if (!session) return
    
    try {
      const scoreQuery = query(
        collection(db, 'scores'),
        where('eventId', '==', session.eventId),
        where('beerId', '==', beerId),
        where('attendeeId', '==', session.attendeeId)
      )
      const scoreSnap = await getDocs(scoreQuery)
      
      if (!scoreSnap.empty) {
        const existingScore = scoreSnap.docs[0].data() as Score
        setValues(existingScore.values)
        // Mark all categories as scored since they have existing values
        setScoredCategories(new Set(CATEGORIES))
      } else {
        // Reset to default values if no existing score
        setValues({ look: 0, aroma: 0, flavour: 0, mouthfeel: 0, finish: 0 })
        setScoredCategories(new Set())
      }
    } catch (err) {
      console.error('Error loading existing score:', err)
      setValues({ look: 0, aroma: 0, flavour: 0, mouthfeel: 0, finish: 0 })
    }
  }

  // Function to load all scored beers for current attendee
  const loadScoredBeers = async () => {
    if (!session) return
    
    try {
      const scoreQuery = query(
        collection(db, 'scores'),
        where('eventId', '==', session.eventId),
        where('attendeeId', '==', session.attendeeId)
      )
      const scoreSnap = await getDocs(scoreQuery)
      const scoredIds = new Set(scoreSnap.docs.map(doc => doc.data().beerId))
      setScoredBeerIds(scoredIds)
    } catch (err) {
      console.error('Error loading scored beers:', err)
    }
  }

  // Load initial data only once
  useEffect(() => {
    if (!session) return
    
    // Load initial data
    listBeers(session.eventId).then(bs => {
      const ordered = bs.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999))
      setBeers(ordered)
      // Only set initial beer if no beer is currently selected
      if (ordered.length && !activeBeerId) {
        setActiveBeerId(ordered.find(b => !b.tasted)?.id ?? ordered[0].id)
      }
    })
    listAttendees(session.eventId).then(as => {
      const map: Record<string, string> = {}
      for (const a of as) map[a.id] = a.name
      setAttendeeNameById(map)
    })
    
    // Load scored beers for current attendee
    loadScoredBeers()
  }, [session])

  // Load existing score when activeBeerId changes (but not on initial load)
  useEffect(() => {
    if (activeBeerId && beers.length > 0) {
      loadExistingScore(activeBeerId)
    }
  }, [activeBeerId])

  // Listen for event status changes separately
  useEffect(() => {
    if (!session) return
    
    const unsubscribe = listenToEventStatus(session.eventId, (event) => {
      if (event && event.status === 'ended') {
        navigate('/results')
      }
    })

    return () => unsubscribe()
  }, [session, navigate])

  const activeBeer = useMemo(() => beers.find(b => b.id === activeBeerId) ?? null, [beers, activeBeerId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!session || !activeBeer) return
    
    // Check if all categories are scored
    if (!allCategoriesScored()) {
      const unscoredCategories = CATEGORIES.filter(c => !scoredCategories.has(c))
      setError(`Please score all categories: ${unscoredCategories.join(', ')}`)
      return
    }
    
    setLoading(true)
    try {
      await submitScore({ eventId: session.eventId, beerId: activeBeer.id, attendeeId: session.attendeeId, values })
      await loadScoredBeers() // Refresh scored beers list
      setMessage('Score saved! You can revise anytime.')
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit score')
    } finally {
      setLoading(false)
    }
  }

  function updateValue(c: Category, v: number) {
    const n = Math.max(0, Math.min(5, Math.floor(Number(v))))
    setValues(prev => ({ ...prev, [c]: n }))
    setScoredCategories(prev => new Set([...prev, c]))
  }

  // Helper function to check if all categories are scored
  function allCategoriesScored(): boolean {
    return CATEGORIES.every(c => scoredCategories.has(c))
  }

  return (
    <div className="container-app">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Score Beers</h1>
        </div>
        
        <div className="card p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Select Beer to Score</h2>
          <div className="grid grid-cols-1 gap-1">
            {beers.map(b => (
              <button 
                key={b.id} 
                className={`p-2 rounded-lg text-left transition-colors ${
                  b.id === activeBeerId 
                    ? 'bg-orange-100 border-2 border-orange-500' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`} 
                onClick={() => {
                  if (b.id !== activeBeerId) {
                    setActiveBeerId(b.id)
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {b.photoUrl && <img src={b.photoUrl} alt="Beer" className="w-6 h-6 object-cover rounded" />}
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {b.orderIndex !== undefined ? `${b.orderIndex + 1}. ` : ''}{b.name}
                    </div>
                    <div className="text-xs text-gray-600">{b.style}</div>
                  </div>
                  {scoredBeerIds.has(b.id) ? <span className="badge badge-green text-xs">scored</span> : <span className="badge badge-orange text-xs">not scored</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeBeer && (
          <div className="card p-4">
            <div className="flex items-start gap-4 mb-4">
              {activeBeer.photoUrl && (
                <img
                  src={activeBeer.photoUrl}
                  alt={activeBeer.name}
                  className="w-20 h-20 object-cover rounded border flex-shrink-0"
                />
              )}
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold mb-1">{activeBeer.name}</h2>
                <div className="text-sm text-gray-600 mb-1">{activeBeer.style}</div>
                <div className="text-xs text-gray-500">Added by: <span className="font-medium">{attendeeNameById[activeBeer.broughtByAttendeeId] ?? activeBeer.broughtByAttendeeId}</span></div>
              </div>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-4">
              {CATEGORIES.map(c => (
                <div key={c} className="flex items-center gap-4">
                  <label className="w-20 text-sm font-medium text-gray-700 capitalize flex-shrink-0">
                    {c}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${
                          values[c] === score
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => updateValue(c, score)}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Validation status */}
              <div className="text-center">
                {!allCategoriesScored() && (
                  <div className="text-sm text-red-600 mb-2">
                    ⚠️ Please score all categories before submitting
                  </div>
                )}
                {allCategoriesScored() && (
                  <div className="text-sm text-green-600 mb-2">
                    ✅ All categories scored - ready to submit!
                  </div>
                )}
              </div>
              
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {message && <div className="text-green-700 text-sm text-center">{message}</div>}
              <button 
                className={`btn w-full ${
                  allCategoriesScored() 
                    ? 'btn-primary' 
                    : 'btn-secondary opacity-50 cursor-not-allowed'
                }`} 
                disabled={loading || !allCategoriesScored()}
              >
                {loading ? 'Saving…' : 'Save Score'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}


