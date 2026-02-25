'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  ClipboardCheck, 
  Bell, 
  Settings,
  LogOut,
  BarChart3,
  UserPlus,
  Calendar,
  Cake,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

interface Student {
  id: string
  name: string
  grade: number
  date_of_birth: string | null
}

interface AbsentStudent {
  id: string
  name: string
  grade: number
  weeks_absent: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [birthdaysToday, setBirthdaysToday] = useState<Student[]>([])
  const [recentAbsences, setRecentAbsences] = useState<AbsentStudent[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // Get settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')

    let seasonStartDate: string | null = null
    let weeksThreshold = 2

    settingsData?.forEach(setting => {
      if (setting.key === 'season_start_date') {
        seasonStartDate = setting.value
      }
      if (setting.key === 'absence_alert_weeks') {
        weeksThreshold = parseInt(setting.value) || 2
      }
    })

    // Get total students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)

    if (!studentsError && students) {
      setTotalStudents(students.length)

      // Get birthdays today
      const today = new Date()
      const todayMonth = today.getMonth() + 1
      const todayDay = today.getDate()

      const birthdayStudents = students.filter(student => {
        if (!student.date_of_birth) return false
        const dob = new Date(student.date_of_birth + 'T00:00:00')
        return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay
      })

      setBirthdaysToday(birthdayStudents)

      // Get cancelled class dates
      const { data: cancelledDates } = await supabase
        .from('class_cancellations')
        .select('cancellation_date')

      const cancelledDateSet = new Set(
        cancelledDates?.map(c => c.cancellation_date) || []
      )

      // Build attendance query - only get records after season start date
      let attendanceQuery = supabase
        .from('attendance_records')
        .select('*')
        .eq('was_present', true)
        .order('attendance_date', { ascending: false })

      if (seasonStartDate) {
        attendanceQuery = attendanceQuery.gte('attendance_date', seasonStartDate)
      }

      const { data: attendance } = await attendanceQuery

      // Filter out attendance from cancelled dates
      const validAttendance = attendance?.filter(
        a => !cancelledDateSet.has(a.attendance_date)
      ) || []

      if (seasonStartDate) {
        const absentStudents: AbsentStudent[] = []

        students.forEach(student => {
          // Find the last time this student was present (after season start)
          const lastPresent = validAttendance.find(a => a.student_id === student.id)
          
          if (!lastPresent) {
            // Never been present since season start
            const seasonStart = new Date(seasonStartDate + 'T00:00:00')
            const diffTime = today.getTime() - seasonStart.getTime()
            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))

            if (diffWeeks >= weeksThreshold) {
              absentStudents.push({
                id: student.id,
                name: student.name,
                grade: student.grade,
                weeks_absent: diffWeeks,
              })
            }
          } else {
            // Calculate weeks since last present
            const lastPresentDate = new Date(lastPresent.attendance_date + 'T00:00:00')
            const diffTime = today.getTime() - lastPresentDate.getTime()
            const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))

            if (diffWeeks >= weeksThreshold) {
              absentStudents.push({
                id: student.id,
                name: student.name,
                grade: student.grade,
                weeks_absent: diffWeeks,
              })
            }
          }
        })

        // Sort by most absent and take top 5
        absentStudents.sort((a, b) => b.weeks_absent - a.weeks_absent)
        setRecentAbsences(absentStudents.slice(0, 5))
      } else {
        // No season start date set - show nothing
        setRecentAbsences([])
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Youth Ministry</h1>
                <p className="text-sm text-gray-600">Development Mode</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Birthdays Today</p>
                <p className="text-3xl font-bold text-gray-900">{birthdaysToday.length}</p>
              </div>
              <Cake className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Need Follow-up</p>
                <p className="text-3xl font-bold text-gray-900">{recentAbsences.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Birthdays Today Section */}
        {birthdaysToday.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Cake className="w-6 h-6 text-purple-600" />
                Birthdays Today 🎉
              </h2>
            </div>
            <div className="space-y-2">
              {birthdaysToday.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">Grade {student.grade}</p>
                  </div>
                  <Cake className="w-5 h-5 text-purple-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Absences Section */}
        {recentAbsences.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                Need Follow-up
              </h2>
              <button
                onClick={() => router.push('/dashboard/alerts')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {recentAbsences.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">Grade {student.grade}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {student.weeks_absent} weeks absent
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => router.push('/dashboard/attendance')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <ClipboardCheck className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Take Attendance</h3>
            <p className="text-sm text-gray-600">Mark who's present today</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/students')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <Users className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Students</h3>
            <p className="text-sm text-gray-600">View and manage roster</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/servants')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <Users className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Servants</h3>
            <p className="text-sm text-gray-600">Manage ministry servants</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/alerts')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <Bell className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Alerts</h3>
            <p className="text-sm text-gray-600">Follow-up notifications</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/reports')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <BarChart3 className="w-10 h-10 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Reports</h3>
            <p className="text-sm text-gray-600">Generate parent messages</p>
          </button>
        </div>

        {/* Getting Started */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard/students/add')}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
            >
              <UserPlus className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Add Students</h3>
                <p className="text-sm text-gray-600">Start by adding your students to the roster</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/attendance')}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
            >
              <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Take Attendance</h3>
                <p className="text-sm text-gray-600">Mark attendance for Friday or Sunday services</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
            >
              <Settings className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Configure Alerts</h3>
                <p className="text-sm text-gray-600">Set up automatic notifications for absent students</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}