'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types'
import { Calendar, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'

type AttendanceWithStudent = {
  student_name: string
  student_grade: number
  was_present: boolean
}

export default function AttendanceHistoryPage() {
  const [attendanceDates, setAttendanceDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceWithStudent[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttendanceDates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadAttendanceForDate(selectedDate)
    }
  }, [selectedDate])

  async function loadAttendanceDates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance_records')
      .select('attendance_date')
      .order('attendance_date', { ascending: false })

    if (data && !error) {
      // Get unique dates
      const uniqueDates = Array.from(new Set(data.map((r) => r.attendance_date)))
      setAttendanceDates(uniqueDates)
      if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0])
      }
    }
    setLoading(false)
  }

  async function loadAttendanceForDate(date: string) {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        was_present,
        students (
          name,
          grade
        )
      `)
      .eq('attendance_date', date)
      .eq('was_present', true)

    if (data && !error) {
      const formatted = data.map((record: any) => ({
        student_name: record.students.name,
        student_grade: record.students.grade,
        was_present: record.was_present,
      }))
      setAttendanceDetails(formatted)
    }
  }

  function generateParentMessage() {
    if (!selectedDate || attendanceDetails.length === 0) return ''

    const dateStr = format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')
    const dayOfWeek = format(new Date(selectedDate), 'EEEE')
    
    const sortedStudents = attendanceDetails
      .filter((a) => a.was_present)
      .sort((a, b) => a.student_name.localeCompare(b.student_name))

    const message = `━━━━━━━━━━━━━━━
✅ ${dayOfWeek}, ${format(new Date(selectedDate), 'MMM d, yyyy')}

Present today:
${sortedStudents.map((s) => `• ${s.student_name}`).join('\n')}

(${sortedStudents.length} students total)
━━━━━━━━━━━━━━━`

    return message
  }

  async function copyToClipboard() {
    const message = generateParentMessage()
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Attendance History
        </h1>
        <p className="text-gray-600">
          View past attendance and generate parent messages
        </p>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 appearance-none"
          >
            {attendanceDates.map((date) => (
              <option key={date} value={date}>
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Summary */}
      {selectedDate && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Present Students ({attendanceDetails.length})
            </h2>
            <div className="space-y-2">
              {attendanceDetails
                .sort((a, b) => a.student_name.localeCompare(b.student_name))
                .map((attendance, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-900">
                      {attendance.student_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      Grade {attendance.student_grade}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Parent Message */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Parent Group Message
            </h2>
            <div className="bg-white rounded-lg p-4 mb-4 font-mono text-sm whitespace-pre-wrap border border-gray-200">
              {generateParentMessage()}
            </div>
            <button
              onClick={copyToClipboard}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                copied
                  ? 'bg-green-50 text-green-700 border-2 border-green-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {attendanceDates.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records yet</p>
        </div>
      )}
    </div>
  )
}
