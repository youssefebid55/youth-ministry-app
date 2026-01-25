'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types'
import { Search, Plus, X, Calendar, UserX } from 'lucide-react'
import { format } from 'date-fns'

type Student = Database['public']['Tables']['students']['Row']
type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row']

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  // Load students
  useEffect(() => {
    loadStudents()
    loadTodaysAttendance()
    checkIfCancelled()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `attendance_date=eq.${selectedDate}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new as AttendanceRecord
            setAttendance((prev) => ({
              ...prev,
              [record.student_id]: record.was_present,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate])

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

  async function loadTodaysAttendance() {
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('attendance_date', selectedDate)

    if (data) {
      const attendanceMap: Record<string, boolean> = {}
      data.forEach((record) => {
        attendanceMap[record.student_id] = record.was_present
      })
      setAttendance(attendanceMap)
    }
  }

  async function checkIfCancelled() {
    const { data } = await supabase
      .from('class_cancellations')
      .select('*')
      .eq('cancellation_date', selectedDate)
      .single()

    setIsCancelled(!!data)
  }

  async function toggleAttendance(studentId: string) {
    const isPresent = !attendance[studentId]
    
    // Optimistic update
    setAttendance((prev) => ({ ...prev, [studentId]: isPresent }))

    // Update database
    const { error } = await supabase
      .from('attendance_records')
      .upsert({
        student_id: studentId,
        attendance_date: selectedDate,
        was_present: isPresent,
        marked_by_servant_id: 'temp-servant-id', // TODO: Replace with actual servant ID from auth
      })

    if (error) {
      console.error('Error updating attendance:', error)
      // Revert optimistic update
      setAttendance((prev) => ({ ...prev, [studentId]: !isPresent }))
    }
  }

  async function cancelClass() {
    const { error } = await supabase
      .from('class_cancellations')
      .insert({
        cancellation_date: selectedDate,
        reason: 'Cancelled by servant',
        marked_by_servant_id: 'temp-servant-id', // TODO: Replace with actual servant ID
      })

    if (!error) {
      setIsCancelled(true)
    }
  }

  // Filter and sort students
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

  const presentCount = Object.values(attendance).filter(Boolean).length
  const totalCount = students.length

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Take Attendance
        </h1>
        <p className="text-gray-600">
          {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Present Today</p>
            <p className="text-3xl font-bold text-primary-600">
              {presentCount}
              <span className="text-lg text-gray-400">/{totalCount}</span>
            </p>
          </div>
          <div className="text-right">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Cancel Class Button */}
      {!isCancelled && (
        <button
          onClick={cancelClass}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
        >
          <UserX className="w-5 h-5" />
          <span className="font-medium">No Class Today</span>
        </button>
      )}

      {isCancelled && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <p className="text-center font-medium">Class cancelled for this date</p>
        </div>
      )}

      {/* Search and Sort */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
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
      </div>

      {/* Quick Add Button */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Quick Add Student</span>
      </button>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map((student) => (
          <button
            key={student.id}
            onClick={() => !isCancelled && toggleAttendance(student.id)}
            disabled={isCancelled}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all tap-highlight-none ${
              attendance[student.id]
                ? 'bg-primary-50 border-primary-500'
                : 'bg-white border-gray-200'
            } ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300'}`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                attendance[student.id]
                  ? 'bg-primary-600 border-primary-600'
                  : 'border-gray-300'
              }`}
            >
              {attendance[student.id] && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-500">Grade {student.grade}</p>
            </div>
          </button>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No students found</p>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal onClose={() => setShowQuickAdd(false)} onAdded={loadStudents} />
      )}
    </div>
  )
}

// Quick Add Modal Component
function QuickAddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('9')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('students')
      .insert({
        name,
        grade: parseInt(grade),
        phone: phone || null,
      })

    setLoading(false)

    if (!error) {
      onAdded()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Quick Add Student</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Student name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade *
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Student'}
          </button>
        </form>
      </div>
    </div>
  )
}
