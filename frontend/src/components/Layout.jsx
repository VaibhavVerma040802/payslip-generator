import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, PlusCircle, List, Menu, X, FileSpreadsheet, Settings, LogOut, User, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate Payslip', icon: PlusCircle },
  { to: '/payslips', label: 'All Payslips', icon: List },
  { to: '/profile', label: 'Company Profile', icon: Settings },
]

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)
    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

export default function Layout() {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize sidebar based on screen size
  useEffect(() => {
    setSidebarOpen(!window.matchMedia('(max-width: 1024px)').matches)
  }, [])

  // Auto-close sidebar on mobile navigate
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--navy-dark)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 22px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <X size={20} />
            </button>
          )}
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
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={12} color="white" />
            </div>
            <div style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{user?.companyName || 'My Company'}</div>
          </div>
          <button 
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
              padding: 0, color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
              fontWeight: 600, transition: 'color 0.2s'
            }}
            onMouseOver={e => e.target.style.color = 'var(--gold)'}
            onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ 
        marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 0), 
        flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column',
        transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* Top Header */}
        <header style={{
          height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ 
                background: 'var(--bg)', border: '1px solid var(--border)', 
                color: 'var(--text)', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8, transition: 'all 0.2s'
              }}
              className="btn-hover"
            >
              <Menu size={18} />
            </button>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
              PaySlip Pro Workspace
            </div>
          </div>

          {/* Theme Switcher */}
          <div style={{ 
            display: 'flex', background: 'var(--bg)', borderRadius: 20, 
            padding: 4, border: '1px solid var(--border)' 
          }}>
            <button 
              onClick={() => setTheme('light')}
              style={{
                background: theme === 'light' ? 'var(--surface)' : 'transparent',
                color: theme === 'light' ? 'var(--navy)' : 'var(--text-light)',
                boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                border: 'none', borderRadius: 16, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <Sun size={14} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Light</span>
            </button>
            <button 
              onClick={() => setTheme('dark')}
              style={{
                background: theme === 'dark' ? 'var(--surface)' : 'transparent',
                color: theme === 'dark' ? 'var(--navy)' : 'var(--text-light)',
                boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                border: 'none', borderRadius: 16, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <Moon size={14} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>Dark</span>
            </button>
            <button 
              onClick={() => setTheme('system')}
              style={{
                background: theme === 'system' ? 'var(--surface)' : 'transparent',
                color: theme === 'system' ? 'var(--navy)' : 'var(--text-light)',
                boxShadow: theme === 'system' ? 'var(--shadow-sm)' : 'none',
                border: 'none', borderRadius: 16, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              <Monitor size={14} /> <span style={{ display: isMobile ? 'none' : 'inline' }}>System</span>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
