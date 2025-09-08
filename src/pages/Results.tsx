 import { useEffect, useMemo, useState } from 'react'
import { loadSession } from '../session'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Beer, Category, Score } from '../types'
import { CATEGORIES } from '../types'
import { listBeers, listAttendees } from '../services/firestore'

export default function Results() {
  const session = loadSession()
  const [beers, setBeers] = useState<Beer[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [attendeeNameById, setAttendeeNameById] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const bs = await listBeers(session.eventId)
      setBeers(bs)
      
      // Load attendee names
      const attendees = await listAttendees(session.eventId)
      const attendeeMap: Record<string, string> = {}
      for (const attendee of attendees) {
        attendeeMap[attendee.id] = attendee.name
      }
      setAttendeeNameById(attendeeMap)
      
      const qScores = query(collection(db, 'scores'), where('eventId', '==', session.eventId))
      const snap = await getDocs(qScores)
      const sc = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Score, 'id'>) })) as Score[]
      setScores(sc)
    })()
  }, [session])

  // Filter out attendees who haven't scored all beers
  const validScores = useMemo(() => {
    if (beers.length === 0) return []
    
    // Count how many beers each attendee has scored
    const attendeeScoreCounts = new Map<string, number>()
    for (const score of scores) {
      const count = attendeeScoreCounts.get(score.attendeeId) ?? 0
      attendeeScoreCounts.set(score.attendeeId, count + 1)
    }
    
    // Only include scores from attendees who have scored all beers
    const validAttendeeIds = new Set<string>()
    for (const [attendeeId, count] of attendeeScoreCounts) {
      if (count === beers.length) {
        validAttendeeIds.add(attendeeId)
      }
    }
    
    return scores.filter(score => validAttendeeIds.has(score.attendeeId))
  }, [scores, beers])

  // Get valid attendee names (only those who completed all scores)
  const validAttendeeNames = useMemo(() => {
    const validAttendeeIds = new Set<string>()
    for (const score of validScores) {
      validAttendeeIds.add(score.attendeeId)
    }
    
    const validNames: Record<string, string> = {}
    for (const attendeeId of validAttendeeIds) {
      if (attendeeNameById[attendeeId]) {
        validNames[attendeeId] = attendeeNameById[attendeeId]
      }
    }
    return validNames
  }, [validScores, attendeeNameById])

  const tally = useMemo(() => {
    const totals = new Map<string, number>()
    const byCategory = new Map<Category, Map<string, number>>()
    for (const c of CATEGORIES) byCategory.set(c, new Map())

    for (const s of validScores) {
      totals.set(s.beerId, (totals.get(s.beerId) ?? 0) + s.total)
      for (const c of CATEGORIES) {
        const cat = byCategory.get(c)!
        cat.set(s.beerId, (cat.get(s.beerId) ?? 0) + (s.values[c] ?? 0))
      }
    }

    const totalWinner = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])[0]
    const categoryWinners = Object.fromEntries(
      CATEGORIES.map(c => {
        const e = Array.from(byCategory.get(c)!.entries()).sort((a, b) => b[1] - a[1])[0]
        return [c, e]
      })
    ) as Record<Category, [string, number] | undefined>

    const beerById = new Map(beers.map(b => [b.id, b]))
    return { totals, totalWinner, categoryWinners, beerById }
  }, [validScores, beers])

  // Fun stats
  const fun = useMemo(() => {
    const byAttendee = new Map<string, number[]>()
    for (const s of validScores) {
      const arr = byAttendee.get(s.attendeeId) ?? []
      arr.push(s.total)
      byAttendee.set(s.attendeeId, arr)
    }
    const entries = Array.from(byAttendee.entries()).map(([attendeeId, totals]) => {
      const avg = totals.reduce((a, b) => a + b, 0) / (totals.length || 1)
      const mean = avg
      const variance = totals.reduce((a, b) => a + (b - mean) ** 2, 0) / (totals.length || 1)
      const stddev = Math.sqrt(variance)
      return { attendeeId, avg, stddev }
    })
    const mostGenerous = entries.sort((a, b) => b.avg - a.avg)[0]
    const toughestCritic = entries.sort((a, b) => a.avg - b.avg)[0]
    const mostConsistent = entries.sort((a, b) => a.stddev - b.stddev)[0]
    return { mostGenerous, toughestCritic, mostConsistent }
  }, [validScores])

  return (
    <div className="container-app">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Festival Results</h1>
          <p className="text-gray-600">The final scores are in!</p>
        </div>

        {tally.totalWinner && (
          <div className="card p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">🏆</span>
              <h2 className="text-2xl font-bold text-gray-900">Winner</h2>
            </div>
            <div className="text-xl font-semibold text-orange-600">
              {tally.beerById.get(tally.totalWinner[0])?.name}
            </div>
            <div className="text-lg text-gray-600">
              {tally.totalWinner[1]} points
            </div>
          </div>
        )}

        {/* Show message if some attendees were excluded */}
        {Object.keys(attendeeNameById).length > Object.keys(validAttendeeNames).length && (
          <div className="card p-6 mb-8 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <h3 className="text-lg font-semibold text-yellow-800">Incomplete Scores</h3>
            </div>
            <p className="text-yellow-700">
              Some attendees didn't complete all their scores and have been excluded from the results. 
              Only attendees who scored all {beers.length} beers are included in the final rankings.
            </p>
          </div>
        )}

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Final Rankings</h2>
          <div className="space-y-2">
            {Array.from(tally.totals.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([beerId, total], index) => {
                const beer = tally.beerById.get(beerId)
                const broughtBy = attendeeNameById[beer?.broughtByAttendeeId || ''] || beer?.broughtByAttendeeId || 'Unknown'
                return (
                  <div key={beerId} className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 
                    index === 1 ? 'bg-gray-50 border-2 border-gray-200' : 
                    index === 2 ? 'bg-orange-50 border-2 border-orange-200' : 
                    'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{beer?.name}</div>
                        <div className="text-sm text-gray-600">by {broughtBy}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{total}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Category Winners</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {CATEGORIES.map(c => {
              const cw = tally.categoryWinners[c]
              if (!cw) return (
                <div key={c} className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium capitalize">Best {c}</div>
                  <div className="text-sm text-gray-600">No scores</div>
                </div>
              )
              const beer = tally.beerById.get(cw[0])
              return (
                <div key={c} className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium capitalize">Best {c}</div>
                  <div className="text-sm text-gray-600">{beer?.name} — {cw[1]} points</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Detailed Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Beer</th>
                  <th className="text-left p-2 font-medium">Brought By</th>
                  {Object.keys(validAttendeeNames).map(attendeeId => (
                    <th key={attendeeId} className="text-center p-2 font-medium">
                      {validAttendeeNames[attendeeId]}
                    </th>
                  ))}
                  <th className="text-center p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(tally.totals.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([beerId, total]) => {
                    const beer = tally.beerById.get(beerId)
                    const broughtBy = attendeeNameById[beer?.broughtByAttendeeId || ''] || beer?.broughtByAttendeeId || 'Unknown'
                    const beerScores = validScores.filter(s => s.beerId === beerId)
                    const scoresByAttendee = new Map(beerScores.map(s => [s.attendeeId, s.total]))
                    
                    return (
                      <tr key={beerId} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{beer?.name}</td>
                        <td className="p-2 text-gray-600">{broughtBy}</td>
                        {Object.keys(validAttendeeNames).map(attendeeId => (
                          <td key={attendeeId} className="text-center p-2">
                            {scoresByAttendee.get(attendeeId) ?? '-'}
                          </td>
                        ))}
                        <td className="text-center p-2 font-bold">{total}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Fun Stats</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50">
              <div className="font-medium text-green-800">Most Generous Scorer</div>
              <div className="text-sm text-green-600 mb-2">Highest average scores given</div>
              <div className="font-semibold">{fun.mostGenerous ? `${validAttendeeNames[fun.mostGenerous.attendeeId] || fun.mostGenerous.attendeeId} — ${fun.mostGenerous.avg.toFixed(2)}` : 'N/A'}</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50">
              <div className="font-medium text-red-800">Toughest Critic</div>
              <div className="text-sm text-red-600 mb-2">Lowest average scores given</div>
              <div className="font-semibold">{fun.toughestCritic ? `${validAttendeeNames[fun.toughestCritic.attendeeId] || fun.toughestCritic.attendeeId} — ${fun.toughestCritic.avg.toFixed(2)}` : 'N/A'}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="font-medium text-blue-800">Most Consistent</div>
              <div className="text-sm text-blue-600 mb-2">Least variation in scores</div>
              <div className="font-semibold">{fun.mostConsistent ? `${validAttendeeNames[fun.mostConsistent.attendeeId] || fun.mostConsistent.attendeeId} — ${fun.mostConsistent.stddev.toFixed(2)}` : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


