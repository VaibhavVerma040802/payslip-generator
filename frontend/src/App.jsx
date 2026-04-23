// PaySlip Pro - Enterprise Statutory Payroll Engine (Final Deployment Trigger)
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GeneratePayslip from './pages/GeneratePayslip'
import PayslipList from './pages/PayslipList'
import PayslipDetail from './pages/PayslipDetail'
import StaffList from './pages/StaffList'
import StaffDetail from './pages/StaffDetail'
import AuditLogs from './pages/AuditLogs'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import VerifyEmail from './pages/VerifyEmail'
import VerifyAction from './pages/VerifyAction'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { useStaffPortal } from './context/StaffPortalContext'

// Portal Pages (to be created)
import PortalLayout from './components/PortalLayout'
import PortalLogin from './pages/portal/PortalLogin'
import PortalChangePassword from './pages/portal/PortalChangePassword'
import PortalForgotPassword from './pages/portal/PortalForgotPassword'
import PortalResetPassword from './pages/portal/PortalResetPassword'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalProfile from './pages/portal/PortalProfile'
import PortalAttendance from './pages/portal/PortalAttendance'
import PortalSummary from './pages/portal/PortalSummary'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PortalProtectedRoute({ children }) {
  const { staffUser, loading } = useStaffPortal()
  if (loading) return null
  if (!staffUser) return <Navigate to="/portal/login" replace />
  // If must change password, redirect to change password (unless already there)
  if (staffUser.mustChangePassword && window.location.pathname !== '/portal/change-password') {
    return <Navigate to="/portal/change-password" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify" element={<VerifyAction />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="generate" element={<GeneratePayslip />} />
        <Route path="payslips" element={<PayslipList />} />
        <Route path="payslips/:id" element={<PayslipDetail />} />
        <Route path="staff" element={<StaffList />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="profile" element={<Profile />} />
        {/* Admin fallback catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Staff Portal Routes */}
      <Route path="/portal/login" element={<PortalLogin />} />
      <Route path="/portal/forgot-password" element={<PortalForgotPassword />} />
      <Route path="/portal/reset-password" element={<PortalResetPassword />} />
      <Route path="/portal/change-password" element={<PortalProtectedRoute><PortalChangePassword /></PortalProtectedRoute>} />

      <Route path="/portal" element={<PortalProtectedRoute><PortalLayout /></PortalProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PortalDashboard />} />
        <Route path="profile" element={<PortalProfile />} />
        <Route path="attendance" element={<PortalAttendance />} />
        <Route path="summary" element={<PortalSummary />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}
