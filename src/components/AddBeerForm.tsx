import { useState } from 'react'
import { addOrUpdateBeer } from '../services/firestore'
import { uploadBeerPhoto } from '../services/storage'
import { Plus, Upload, X } from 'lucide-react'

interface AddBeerFormProps {
  eventId: string
  hostAttendeeId: string
  onBeerAdded: () => void
  onCancel: () => void
}

export default function AddBeerForm({ eventId, hostAttendeeId, onBeerAdded, onCancel }: AddBeerFormProps) {
  const [beerName, setBeerName] = useState('')
  const [beerBrewery, setBeerBrewery] = useState('')
  const [beerStyle, setBeerStyle] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (!beerName.trim()) return setError('Enter beer name')
    if (!beerBrewery.trim()) return setError('Enter brewery name')
    if (!beerStyle.trim()) return setError('Enter beer style')
    
    setLoading(true)
    try {
      const beerId = await addOrUpdateBeer(eventId, {
        name: beerName.trim(),
        brewery: beerBrewery.trim(),
        style: beerStyle.trim(),
        broughtByAttendeeId: hostAttendeeId,
      })
      
      if (photoFile) {
        const url = await uploadBeerPhoto(eventId, beerId, photoFile)
        await addOrUpdateBeer(eventId, { 
          id: beerId, 
          name: beerName.trim(), 
          brewery: beerBrewery.trim(), 
          style: beerStyle.trim(), 
          broughtByAttendeeId: hostAttendeeId, 
          photoUrl: url 
        })
      }
      
      // Reset form
      setBeerName('')
      setBeerBrewery('')
      setBeerStyle('')
      setPhotoFile(null)
      
      onBeerAdded()
    } catch (err: any) {
      setError(err.message ?? 'Failed to add beer')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add New Beer</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beer Name *
          </label>
          <input
            type="text"
            value={beerName}
            onChange={(e) => setBeerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., IPA, Stout, Lager"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brewery *
          </label>
          <input
            type="text"
            value={beerBrewery}
            onChange={(e) => setBeerBrewery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., Sierra Nevada, Guinness"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Style *
          </label>
          <input
            type="text"
            value={beerStyle}
            onChange={(e) => setBeerStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="e.g., American IPA, Irish Stout"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo (optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="beer-photo"
              disabled={loading}
            />
            <label
              htmlFor="beer-photo"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">
                {photoFile ? photoFile.name : 'Choose Photo'}
              </span>
            </label>
            {photoFile && (
              <button
                type="button"
                onClick={() => setPhotoFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-orange flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Beer
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
