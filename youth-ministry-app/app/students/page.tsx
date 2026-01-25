'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types'
import { Search, Plus, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'

type Student = Database['public']['Tables']['students']['Row']

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data && !error) {
      setStudents(data)
    }
    setLoading(false)
  }

  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        return a.grade - b.grade
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Students
        </h1>
        <p className="text-gray-600">
          {students.length} active students
        </p>
      </div>

      {/* Add Student Button */}
      <Link
        href="/students/add"
        className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Add New Student</span>
      </Link>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('name')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            sortBy === 'name'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Sort by Name
        </button>
        <button
          onClick={() => setSortBy('grade')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            sortBy === 'grade'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Sort by Grade
        </button>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map((student) => (
          <Link
            key={student.id}
            href={`/students/${student.id}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary-600" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-500">Grade {student.grade}</p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No students found</p>
        </div>
      )}
    </div>
  )
}
