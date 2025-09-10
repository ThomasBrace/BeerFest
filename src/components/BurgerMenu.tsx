import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Plus, Users, Menu, X, HelpCircle, Home } from 'lucide-react'

interface BurgerMenuProps {
  session: any
}

export default function BurgerMenu({ session }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Burger Button */}
      <button
        onClick={toggleMenu}
        className="btn btn-secondary flex items-center gap-2 p-2"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
        <span className="hidden sm:inline">Menu</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={closeMenu}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            {session?.isHost && (
              <Link 
                to="/host" 
                className="btn btn-primary w-full flex items-center gap-3 justify-start"
                onClick={closeMenu}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
            
            <Link 
              to="/create" 
              className="btn btn-secondary w-full flex items-center gap-3 justify-start"
              onClick={closeMenu}
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
            
            <Link 
              to="/join" 
              className="btn btn-primary w-full flex items-center gap-3 justify-start"
              onClick={closeMenu}
            >
              <Users className="w-5 h-5" />
              Join Event
            </Link>

            <Link 
              to="/how-it-works" 
              className="btn btn-secondary w-full flex items-center gap-3 justify-start"
              onClick={closeMenu}
            >
              <HelpCircle className="w-5 h-5" />
              How It Works
            </Link>

            <Link 
              to="/" 
              className="btn btn-secondary w-full flex items-center gap-3 justify-start"
              onClick={closeMenu}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
          </nav>

          {/* Footer */}
          {session && (
            <div className="p-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">
                Logged in as: <span className="font-medium">{session.attendeeName}</span>
              </div>
              <div className="text-xs text-gray-500">
                {session.isHost ? 'Host' : 'Attendee'} • {session.eventName}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
