'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Bell, Phone, Mail, AlertTriangle } from 'lucide-react'

interface StudentAlert {
  id: string
  name: string
  phone: string
  email?: string
  parent_phone: string
  weeks_absent: number
  last_present: string | null
}

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<StudentAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')

      if (studentsError) throw studentsError

      // Get attendance records from the last 6 weeks
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('date', sixWeeksAgo.toISOString().split('T')[0])
        .eq('present', true)

      if (attendanceError) throw attendanceError

      // Calculate weeks absent for each student
      const studentAlerts: StudentAlert[] = []
      
      for (const student of students || []) {
        const studentAttendance = (attendance || []).filter(
          (record: any) => record.student_id === student.id
        )

        const lastPresent = studentAttendance.length > 0
          ? studentAttendance[studentAttendance.length - 1].date
          : null

        const weeksAbsent = lastPresent
          ? Math.floor((Date.now() - new Date(lastPresent).getTime()) / (7 * 24 * 60 * 60 * 1000))
          : 6

        if (weeksAbsent >= 2) {
          studentAlerts.push({
            id: student.id,
            name: student.name,
            phone: student.phone,
            email: student.email,
            parent_phone: student.parent_phone,
            weeks_absent: weeksAbsent,
            last_present: lastPresent
          })
        }
      }

      setAlerts(studentAlerts.sort((a, b) => b.weeks_absent - a.weeks_absent))
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Follow-Up Alerts</h1>
              <p className="text-sm text-gray-600">
                {alerts.length} {alerts.length === 1 ? 'student needs' : 'students need'} follow-up
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      alert.weeks_absent >= 4 ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        alert.weeks_absent >= 4 ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                      <p className="text-sm text-gray-600">
                        Absent for {alert.weeks_absent} {alert.weeks_absent === 1 ? 'week' : 'weeks'}
                      </p>
                      {alert.last_present && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last present: {new Date(alert.last_present).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Student Contact</p>
                    {alert.phone && (
                      
                        href={`tel:${alert.phone}`}
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-2"
                      >
                        <Phone className="w-4 h-4" />
                        {alert.phone}
                      </a>
                    )}
                    {alert.email && (
                      
                        href={`mailto:${alert.email}`}
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Mail className="w-4 h-4" />
                        {alert.email}
                      </a>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Parent Contact</p>
                    
                      href={`tel:${alert.parent_phone}`}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Phone className="w-4 h-4" />
                      {alert.parent_phone}
                    </a>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📱 Suggested message: "Hi {alert.name.split(' ')[0]}, we've missed you at youth group! 
                    Everything okay? We'd love to see you this week. Let me know if you need anything!"
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No students need follow-up at this time</p>
          </div>
        )}
      </main>
    </div>
  )
}