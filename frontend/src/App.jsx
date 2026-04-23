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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
