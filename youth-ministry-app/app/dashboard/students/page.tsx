'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Student } from '@/lib/types'
import { ArrowLeft, Plus, Search, Phone, Mail, Edit2, Trash2 } from 'lucide-react'

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Students</h1>
                <p className="text-sm text-gray-600">{students.length} total</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/students/add')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Student
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <div key={student.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{student.name}</h3>
                  {student.grade && (
                    <p className="text-sm text-gray-600">Grade {student.grade}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/students/edit/${student.id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {student.phone && (
                  
                    href={`tel:${student.phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
                  >
                    <Phone className="w-4 h-4" />
                    {student.phone}
                  </a>
                )}
                {student.email && (
                  
                    href={`mailto:${student.email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
                  >
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </a>
                )}
                {student.parent_phone && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Parent Phone:</p>
                    
                      href={`tel:${student.parent_phone}`}
                      className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
                    >
                      <Phone className="w-4 h-4" />
                      {student.parent_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No students found' : 'No students in the roster yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/dashboard/students/add')}
                className="btn-primary"
              >
                Add First Student
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}