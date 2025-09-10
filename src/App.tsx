import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadSession, clearSession } from './session'
import { Settings, Users, HelpCircle, RefreshCw } from 'lucide-react'
import CreateEvent from './pages/CreateEvent'
import JoinEvent from './pages/JoinEvent'
import Host from './pages/Host'
import Score from './pages/Score'
import Results from './pages/Results'
import HowItWorks from './pages/HowItWorks'
import BurgerMenu from './components/BurgerMenu'

function HomePage() {
  const session = loadSession()
  
  const handleClearSession = () => {
    clearSession()
    // Force a page refresh to update the UI
    window.location.reload()
  }
  
  return (
    <div className="container-app text-center">
      <div className="mb-8">
        <img src="/beerfest-logo.png" alt="Beerfest" className="mx-auto h-24 w-24 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Build your own beer fest</h1>
        <p className="text-lg text-gray-600">Join or organize your beer tasting event</p>
      </div>
      
      <div className="space-y-4 max-w-sm mx-auto">
        {session && (
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Continue Your Session</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Welcome back, <span className="font-medium">{session.attendeeName}</span>!
            </p>
            <div className="space-y-2">
              {session.isHost ? (
                <Link to="/host" className="btn btn-primary w-full">
                  Continue Hosting "{session.eventName}"
                </Link>
              ) : (
                <Link to="/score" className="btn btn-primary w-full">
                  Continue Scoring "{session.eventName}"
                </Link>
              )}
              <button 
                onClick={handleClearSession}
                className="btn btn-secondary w-full text-sm"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}
        
        <Link to="/create" className="btn btn-primary w-full flex items-center justify-center gap-2">
          <Settings className="w-5 h-5" />
          Organize Festival
        </Link>
        <Link to="/join" className="btn btn-secondary w-full flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          Join Festival
        </Link>
        <Link to="/how-it-works" className="btn btn-secondary w-full flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5" />
          How It Works
        </Link>
      </div>
      
      <div className="mt-8 text-sm text-gray-500 space-y-1">
        <p>Organizers create festivals and share codes.</p>
        <p>Attendees join using the festival code.</p>
        {session && (
          <p className="text-xs text-gray-400 mt-2">
            Your session is saved - you can close your browser and return anytime!
          </p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(loadSession())

  useEffect(() => {
    // Update session state when localStorage changes
    const handleStorageChange = () => {
      setSession(loadSession())
    }
    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom events from other components
    const handleSessionUpdate = () => {
      setSession(loadSession())
    }
    window.addEventListener('sessionUpdated', handleSessionUpdate)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sessionUpdated', handleSessionUpdate)
    }
  }, [])

  return (
    <BrowserRouter>
      <header className="header">
        <div className="container-app flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2 brand-title">
            <img src="/beerfest-logo.png" alt="Beerfest" className="h-8 w-8" />
            BeerFestify
          </Link>
          <BurgerMenu session={session} />
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/join" element={<JoinEvent />} />
        <Route path="/host" element={<Host />} />
        <Route path="/score" element={<Score />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
