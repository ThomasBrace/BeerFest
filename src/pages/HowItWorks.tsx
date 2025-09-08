import { Link } from 'react-router-dom'
import { Beer, Settings, BarChart, Smartphone, RefreshCw, Star, Trophy, Eye, Utensils, Hand, Flag, Lightbulb, Zap, CheckCircle, QrCode, TrendingUp, Camera, Users, Wind } from 'lucide-react'

export default function HowItWorks() {
  return (
    <div className="container-app">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How BeerFestify Works</h1>
          <p className="text-lg text-gray-600">Everything you need to know about running a beer tasting event</p>
        </div>

        {/* Overview */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Beer className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">The Concept</h2>
          </div>
          <p className="text-gray-600 mb-4">
            BeerFestify is designed for casual beer tasting events where attendees bring beers to share and everyone scores them. 
            It's perfect for home gatherings, parties, or organized tasting events.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Perfect for:</strong> 2-20 people, home parties, beer clubs, team building events, or any casual gathering where you want to taste and compare beers together.
            </p>
          </div>
        </div>

        {/* Step by Step */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">How to Run an Event</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Create Your Event</h3>
                <p className="text-gray-600 text-sm">As the host, create a new festival and register your own beer. You'll get a unique festival code to share.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Share the Code</h3>
                <p className="text-gray-600 text-sm">Share the festival code (or QR code) with your guests. They can join using their phone or computer.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Guests Join & Register</h3>
                <p className="text-gray-600 text-sm">Each guest enters the code, adds their name, and optionally registers a beer they're bringing.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Randomize Order</h3>
                <p className="text-gray-600 text-sm">The host can randomize the tasting order to keep things fair and interesting.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Score Beers</h3>
                <p className="text-gray-600 text-sm">Everyone scores each beer on 5 categories: Look, Aroma, Flavour, Mouthfeel, and Finish (1-5 points each).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">View Results</h3>
                <p className="text-gray-600 text-sm">When scoring is complete, everyone can see the rankings, winners, and fun statistics!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring System */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Scoring System</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Each beer is scored on 5 categories, with 1-5 points per category (total possible: 25 points):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Look</div>
                  <div className="text-sm text-gray-600">Appearance, color, clarity</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Aroma</div>
                  <div className="text-sm text-gray-600">Smell, fragrance, bouquet</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Flavour</div>
                  <div className="text-sm text-gray-600">Taste, complexity, balance</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hand className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Mouthfeel</div>
                  <div className="text-sm text-gray-600">Body, texture, carbonation</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Finish</div>
                  <div className="text-sm text-gray-600">Aftertaste, lingering notes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Tips for Success</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">Encourage Variety</div>
                <div className="text-sm text-gray-600">Ask guests to bring different styles (IPA, Stout, Lager, etc.) for more interesting comparisons</div>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">Provide Water & Snacks</div>
                <div className="text-sm text-gray-600">Have water available for palate cleansing and light snacks to enhance the tasting experience</div>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">Take Your Time</div>
                <div className="text-sm text-gray-600">Don't rush through beers - give everyone time to properly taste and score each one</div>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900">Discuss Results</div>
                <div className="text-sm text-gray-600">After scoring, discuss what everyone liked and why - it's often the most fun part!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Mobile-friendly design</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                <span className="text-sm">QR code sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Real-time scoring progress</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Session persistence</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Automatic rankings</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Beer photo uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Fun statistics</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Optional beer registration</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Ready to Start?</h3>
            <p className="text-gray-600">Create your first beer tasting event and start having fun!</p>
            <div className="flex gap-4 justify-center">
              <Link to="/create" className="btn btn-primary">
                Create Event
              </Link>
              <Link to="/join" className="btn btn-secondary">
                Join Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
