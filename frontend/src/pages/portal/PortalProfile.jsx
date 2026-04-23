import { useState } from 'react'
import { useStaffPortal } from '../../context/StaffPortalContext'
import { User, Phone, Mail, Briefcase, Building, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api'

export default function PortalProfile() {
  const { staffUser, setStaffUser } = useStaffPortal()
  const [phone, setPhone] = useState(staffUser?.phone || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem('staffToken')
      await api.put('/portal/me', { phone }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStaffUser({ ...staffUser, phone })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-5">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm">
              <User className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{staffUser?.fullName}</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{staffUser?.designation}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Personal Information</h3>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Read-only fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee ID</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={staffUser?.employeeId || ''}
                    className="pl-10 block w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={staffUser?.email || ''}
                    className="pl-10 block w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={staffUser?.department || 'Not specified'}
                    className="pl-10 block w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed sm:text-sm"
                  />
                </div>
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number <span className="text-gray-400 font-normal ml-1">(Editable)</span></label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm transition-shadow"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Need to update other information?</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          Role, salary, and designation changes must be requested through your HR administrator.
        </p>
      </div>
    </div>
  )
}
