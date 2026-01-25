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
  Calendar
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick Action Cards */}
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

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Add Students</h3>
                <p className="text-sm text-gray-600">Start by adding your students to the roster</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Take Attendance</h3>
                <p className="text-sm text-gray-600">Mark attendance for Friday or Sunday services</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Settings className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Configure Alerts</h3>
                <p className="text-sm text-gray-600">Set up automatic notifications for absent students</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}