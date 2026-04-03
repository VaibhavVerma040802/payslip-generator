import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, PlusCircle, List, Menu, X, FileSpreadsheet } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate Payslip', icon: PlusCircle },
  { to: '/payslips', label: 'All Payslips', icon: List },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--navy-dark)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 22px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileSpreadsheet size={18} color="var(--navy-dark)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 700,
                color: 'white', lineHeight: 1.1,
              }}>PaySlip<span style={{ color: 'var(--gold)' }}>Pro</span></div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                Payroll Management
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, padding: '4px 10px 10px', textTransform: 'uppercase' }}>
            Menu
          </div>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 4,
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(255,255,255,0.3)',
        }}>
          v1.0.0 · PaySlip Pro
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
