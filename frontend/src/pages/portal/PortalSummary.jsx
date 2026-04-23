import { useState, useEffect } from 'react'
import { BarChart3, Clock, CalendarDays, TrendingUp } from 'lucide-react'
import api from '../../api'

export default function PortalSummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('staffToken')
      const res = await api.get('/attendance/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSummary(res.data.summary)
    } catch (err) {
      console.error('Failed to fetch summary', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
            Weekly Summary
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your attendance analytics for the current week (Mon-Sun).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Total Hours</h3>
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {summary?.totalWeekHours?.toFixed(2) || '0.00'}
              <span className="text-base font-normal text-green-700 dark:text-green-400 ml-1">h</span>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Days Present</h3>
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {summary?.validDays || 0}
              <span className="text-base font-normal text-blue-700 dark:text-blue-400 ml-1">days</span>
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">Daily Average</h3>
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {summary?.weeklyAverage?.toFixed(2) || '0.00'}
              <span className="text-base font-normal text-purple-700 dark:text-purple-400 ml-1">h/day</span>
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payroll Implications</h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center border border-green-200 dark:border-green-800 mt-0.5 mr-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
              </div>
              <p>A day counts as a full working day only if a complete punch-in and punch-out sequence is recorded.</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800 mt-0.5 mr-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              </div>
              <p>Overtime is calculated for any time exceeding 8.5 hours per day, capped at a maximum of 4 hours of overtime per day.</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border border-red-200 dark:border-red-800 mt-0.5 mr-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
              </div>
              <p>Missing punch-outs or shifts extending beyond 16 hours are flagged for HR review and may delay accurate payroll processing.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
