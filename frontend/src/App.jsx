import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GeneratePayslip from './pages/GeneratePayslip'
import PayslipList from './pages/PayslipList'
import PayslipDetail from './pages/PayslipDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="generate" element={<GeneratePayslip />} />
        <Route path="payslips" element={<PayslipList />} />
        <Route path="payslips/:id" element={<PayslipDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
