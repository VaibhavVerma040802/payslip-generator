import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, PlusCircle, List, Menu, X, 
  FileSpreadsheet, Settings, LogOut, User, 
  Sun, Moon, Monitor, ChevronLeft 
} from 'lucide-react'
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
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(!window.matchMedia('(max-width: 1024px)').matches)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.5)', 
            zIndex: 100, backdropFilter: 'blur(4px)', transition: 'all 0.3s'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--navy-dark)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 120,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Brand Header */}
        <div style={{
          height: 'var(--header-h)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--gold) 0%, #f59e0b 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            }}>
              <FileSpreadsheet size={20} color="var(--navy-dark)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 19, fontWeight: 800,
                color: 'white', letterSpacing: '-0.02em'
              }}>PaySlip<span style={{ color: 'var(--gold)' }}>Pro</span></div>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sidebar */}
        <nav style={{ padding: '24px 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', padding: '0 12px 16px', textTransform: 'uppercase' }}>
            Main Menu
          </div>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                marginBottom: 6,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={18} opacity={0.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Hook */}
        <div style={{
          padding: '20px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 12, 
            padding: '12px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: 16, marginBottom: 12 
          }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 10, 
              background: 'var(--navy-light)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <User size={16} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.companyName || 'Corporate Account'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Verified Workspace</div>
            </div>
          </div>
          <button 
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '10px', borderRadius: 12, color: '#f87171', fontSize: 13, 
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Framework */}
      <main style={{ 
        marginLeft: isMobile ? 0 : (sidebarOpen ? 'var(--sidebar-w)' : 0), 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 0
      }}>
        
        {/* Universal Header */}
        <header style={{
          height: 'var(--header-h)', 
          background: 'var(--surface)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 clamp(16px, 4vw, 32px)',
          position: 'sticky', 
          top: 0, 
          zIndex: 80,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={toggleSidebar}
              style={{ 
                background: 'var(--bg)', border: '1px solid var(--border)', 
                color: 'var(--text)', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 12, transition: 'all 0.2s'
              }}
              className="btn-hover"
            >
              <Menu size={20} />
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', opacity: 0.9, letterSpacing: '-0.01em' }}>
              Workspace Console
            </div>
          </div>

          {/* Theme Control System */}
          <div style={{ 
            display: 'flex', background: 'var(--bg)', borderRadius: 14, 
            padding: 3, border: '1.5px solid var(--border)' 
          }}>
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'Sys' }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  background: theme === t.id ? 'var(--surface)' : 'transparent',
                  color: theme === t.id ? 'var(--gold)' : 'var(--text-light)',
                  boxShadow: theme === t.id ? 'var(--shadow-sm)' : 'none',
                  border: 'none', borderRadius: 11, padding: '7px 14px',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
                }}
              >
                <t.icon size={15} strokeWidth={2.5} />
                <span style={{ display: isMobile ? 'none' : 'inline' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Global Body */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
