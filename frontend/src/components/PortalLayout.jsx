import { Outlet, Link, useLocation } from 'react-router-dom'
import { useStaffPortal } from '../context/StaffPortalContext'
import { LogOut, User, Clock, LayoutDashboard, CalendarDays } from 'lucide-react'

export default function PortalLayout() {
  const { staffUser, logout } = useStaffPortal()
  const location = useLocation()

  const navLinks = [
    { name: 'Dashboard', path: '/portal/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/portal/profile', icon: User },
    { name: 'Attendance', path: '/portal/attendance', icon: Clock },
    { name: 'Summary', path: '/portal/summary', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {staffUser?.companyLogo ? (
                <img src={staffUser.companyLogo} alt="Company Logo" className="h-8 w-auto rounded-md" />
              ) : (
                <div className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-700 dark:text-green-400 font-bold text-lg">
                    {staffUser?.companyName?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <span className="ml-3 font-bold text-xl text-gray-900 dark:text-white">Staff Portal</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                Welcome, {staffUser?.fullName}
              </span>
              <button
                onClick={logout}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Nav (Desktop) / Top Tabs (Mobile) */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0 px-4 sm:px-0">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                    ${isActive 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      flex-shrink-0 -ml-1 mr-3 h-5 w-5
                      ${isActive ? 'text-green-500 dark:text-green-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}
                    `}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden px-4 sm:px-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
