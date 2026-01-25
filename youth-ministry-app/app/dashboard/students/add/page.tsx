'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'

export default function AddStudentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    grade: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('students')
        .insert([formData])

      if (error) throw error

      alert('Student added successfully!')
      router.push('/dashboard/students')
    } catch (error: any) {
      alert('Error adding student: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/students')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Student</h1>
              <p className="text-sm text-gray-600">Add a new student to the roster</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    id="grade"
                    name="grade"
                    type="text"
                    value={formData.grade}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="9, 10, 11, or 12"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="student@email.com"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Phone Number *
                </label>
                <input
                  id="parent_phone"
                  name="parent_phone"
                  type="tel"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div>
                <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Email Address
                </label>
                <input
                  id="parent_email"
                  name="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="parent@email.com"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/students')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Add Student'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}