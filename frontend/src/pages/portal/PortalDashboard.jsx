import { useState, useEffect } from 'react'
import { LogIn, LogOut, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'

export default function PortalDashboard() {
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchTodayRecord()
  }, [])

  const fetchTodayRecord = async () => {
    try {
      const token = localStorage.getItem('staffToken')
      const res = await api.get('/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTodayRecord(res.data.attendance)
    } catch (err) {
      console.error('Failed to fetch attendance', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePunchIn = async () => {
    try {
      const token = localStorage.getItem('staffToken')
      const res = await api.post('/attendance/punch-in', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTodayRecord(res.data.attendance)
      toast.success('Punched in successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to punch in')
    }
  }

  const handlePunchOut = async () => {
    try {
      const token = localStorage.getItem('staffToken')
      const res = await api.post('/attendance/punch-out', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTodayRecord(res.data.attendance)
      toast.success('Punched out successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to punch out')
    }
  }

  // Calculate live duration if punched in
  let liveDuration = 0
  if (todayRecord?.punchIn && !todayRecord?.punchOut) {
    liveDuration = (currentTime - new Date(todayRecord.punchIn)) / (1000 * 60 * 60)
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Overview</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 min-w-[200px] text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-1">Current Time</p>
            <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Punch Widget */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
            {!todayRecord ? (
              <>
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">You haven't punched in yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Standard working hours start at 10:30 AM.</p>
                <button
                  onClick={handlePunchIn}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-lg"
                >
                  Punch In Now
                </button>
              </>
            ) : !todayRecord.punchOut ? (
              <>
                <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                  <LogOut className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">You are currently clocked in</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Since {formatTime(todayRecord.punchIn)}</p>
                <button
                  onClick={handlePunchOut}
                  className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-lg"
                >
                  Punch Out
                </button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Shift Completed</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">You've completed your work for today.</p>
                <div className="bg-white dark:bg-gray-800 rounded px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  Total Hours: {todayRecord.totalHours.toFixed(2)}h
                </div>
              </>
            )}
          </div>

          {/* Stats Widget */}
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex items-center">
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Active Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayRecord?.totalHours 
                    ? todayRecord.totalHours.toFixed(2) 
                    : liveDuration.toFixed(2)}<span className="text-base font-normal text-gray-500">h</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 flex items-center">
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Standard Target</p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    8.50<span className="text-base font-normal text-gray-500">h</span>
                  </p>
                  {todayRecord?.overtimeHours > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      + {todayRecord.overtimeHours.toFixed(2)}h OT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {todayRecord?.status === 'flagged' && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Review Required</h4>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">{todayRecord.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
