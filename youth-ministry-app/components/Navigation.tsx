'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  CheckSquare, 
  Users, 
  Heart, 
  Bell, 
  LayoutDashboard 
} from 'lucide-react'

const navItems = [
  {
    href: '/attendance',
    label: 'Attendance',
    icon: CheckSquare,
  },
  {
    href: '/students',
    label: 'Students',
    icon: Users,
  },
  {
    href: '/my-kids',
    label: 'My Kids',
    icon: Heart,
  },
  {
    href: '/alerts',
    label: 'Alerts',
    icon: Bell,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
]

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full tap-highlight-none transition-colors ${
                isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} 
              />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
