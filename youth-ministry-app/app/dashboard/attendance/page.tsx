'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Student } from '@/lib/types'
import { ArrowLeft, Check, X, Save, Calendar } from 'lucide-react'

export default function AttendancePage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceType, setServiceType] = useState<'friday' | 'sunday'>('friday')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const records = students.map(student => ({
        student_id: student.id,
        date: date,
        service_type: serviceType,
        present: attendance[student.id] || false,
        marked_by: user.id
      }))

      const { error } = await supabase
        .from('attendance_records')
        .insert(records)

      if (error) throw error

      alert('Attendance saved successfully!')
      setAttendance({})
    } catch (error: any) {
      alert('Error saving attendance: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendance).filter(Boolean).length
  const totalCount = students.length

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
                <h1 className="text-xl font-bold text-gray-900">Take Attendance</h1>
                <p className="text-sm text-gray-600">
                  {presentCount} of {totalCount} present
                </p>
              </div>
            </div>
            <button
              onClick={saveAttendance}
              disabled={saving || presentCount === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as 'friday' | 'sunday')}
                className="input-field"
              >
                <option value="friday">Friday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => toggleAttendance(student.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                attendance[student.id]
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    attendance[student.id]
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}>
                    {attendance[student.id] ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <X className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    {student.grade && (
                      <p className="text-sm text-gray-600">Grade {student.grade}</p>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  attendance[student.id] ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {attendance[student.id] ? 'Present' : 'Absent'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {students.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No students in the roster yet</p>
            <button
              onClick={() => router.push('/dashboard/students')}
              className="btn-primary"
            >
              Add Students
            </button>
          </div>
        )}
      </main>
    </div>
  )
}