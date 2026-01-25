'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    pendingAlerts: 0,
    recentAttendance: [] as { date: string; count: number }[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)

    // Total active students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Pending alerts
    const { count: pendingAlerts } = await supabase
      .from('absence_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('followed_up', false)

    // Recent attendance (last 8 sessions)
    const { data: recentData } = await supabase
      .from('attendance_records')
      .select('attendance_date, was_present')
      .eq('was_present', true)
      .order('attendance_date', { ascending: false })
      .limit(1000)

    // Group by date and count
    const attendanceByDate: Record<string, number> = {}
    recentData?.forEach((record) => {
      attendanceByDate[record.attendance_date] = (attendanceByDate[record.attendance_date] || 0) + 1
    })

    const recentAttendance = Object.entries(attendanceByDate)
      .slice(0, 8)
      .map(([date, count]) => ({ date, count }))
      .reverse()

    const avgAttendance = recentAttendance.length > 0
      ? Math.round(recentAttendance.reduce((sum, a) => sum + a.count, 0) / recentAttendance.length)
      : 0

    setStats({
      totalStudents: totalStudents || 0,
      averageAttendance: avgAttendance,
      pendingAlerts: pendingAlerts || 0,
      recentAttendance,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Youth ministry overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
          <p className="text-sm text-gray-600">Total Students</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.averageAttendance}</p>
          <p className="text-sm text-gray-600">Avg Attendance</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingAlerts}</p>
          <p className="text-sm text-gray-600">Pending Follow-Ups</p>
        </div>
      </div>

      {/* Recent Attendance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Recent Attendance
        </h2>
        <div className="space-y-3">
          {stats.recentAttendance.map((session) => {
            const percentage = Math.round((session.count / stats.totalStudents) * 100)
            return (
              <div key={session.date}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {session.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {stats.recentAttendance.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No attendance data yet</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-primary-50 rounded-xl border border-primary-200 p-5">
        <h3 className="font-semibold text-primary-900 mb-2">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li>• Take attendance immediately after class for accuracy</li>
          <li>• Check alerts regularly to follow up with absent students</li>
          <li>• Update student info when contact details change</li>
          <li>• Generate parent messages the day after class</li>
        </ul>
      </div>
    </div>
  )
}
