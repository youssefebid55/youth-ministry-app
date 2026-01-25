'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types'
import { Phone, MapPin, GraduationCap, Calendar } from 'lucide-react'

type Student = Database['public']['Tables']['students']['Row']

export default function MyKidsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignedStudents()
  }, [])

  async function loadAssignedStudents() {
    setLoading(true)
    
    // TODO: Replace with actual servant ID from auth
    const servantId = 'temp-servant-id'

    const { data, error } = await supabase
      .from('servant_assignments')
      .select(`
        student:students (
          id,
          name,
          phone,
          address,
          grade,
          photo_url,
          is_active
        )
      `)
      .eq('servant_id', servantId)

    if (data && !error) {
      const studentsList = data.map((item: any) => item.student).filter(Boolean)
      setStudents(studentsList)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Kids
        </h1>
        <p className="text-gray-600">
          {students.length} students assigned to you
        </p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No students assigned yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Contact an admin to get students assigned
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary-600">
                      {student.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {student.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm">Grade {student.grade}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                {student.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a
                      href={`tel:${student.phone}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {student.phone}
                    </a>
                  </div>
                )}

                {student.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(student.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      {student.address}
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={() => loadRecentAttendance(student.id)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">View Attendance History</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function loadRecentAttendance(studentId: string) {
  // TODO: Implement attendance history modal or navigation
  alert('Attendance history coming soon!')
}
