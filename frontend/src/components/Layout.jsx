import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, PlusCircle, List, Menu,
  FileSpreadsheet, Settings, LogOut, User, Users,
  Sun, Moon, Monitor, ChevronLeft, ChevronRight, ChevronDown, Activity, Download, Bell, CalendarDays
} from 'lucide-react'
import api from '../api'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import PageTransition from './PageTransition'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Generate Payslip', icon: PlusCircle },
  { to: '/payslips', label: 'All Payslips', icon: List },
  { to: '/staff', label: 'Staff Management', icon: Users },
  { to: '/leave-requests', label: 'Leave Requests', icon: Bell },
  { to: '/audit-logs', label: 'Audit Logs', icon: Activity },
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
  const navigate = useNavigate()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/leaves/admin/notifications')
      setNotifications(res.data.data)
    } catch (err) {
      console.error('Failed to fetch notifications')
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/leaves/notifications/${id}/read`)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark as read')
    }
  }

  const archiveNotification = async (id) => {
    try {
      await api.put(`/leaves/notifications/${id}/archive`)
      fetchNotifications()
      toast.success('Notification archived')
    } catch (err) {
      toast.error('Failed to archive')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/leaves/admin/mark-as-read')
      fetchNotifications()
      toast.success('All marked as read')
    } catch (err) {
      toast.error('Action failed')
    }
  }

  const handleLeaveAction = async (id, status) => {
    try {
      await api.post('/leaves/admin/respond', { id, status })
      toast.success(`Leave ${status.toLowerCase()}`)
      fetchNotifications()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      window.deferredPrompt = e
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      window.deferredPrompt = null
      setDeferredPrompt(null)
    }

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else {
      import('react-hot-toast').then(mod => {
        mod.default('To install, click the Install icon (🖥️) in your address bar, or use "Add to Home Screen" in your mobile menu.', { duration: 5000, icon: '💡' });
      });
    }
  }

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
            position: 'fixed', inset: 0, background: 'rgba(26, 26, 26, 0.5)', 
            zIndex: 100, backdropFilter: 'blur(4px)', transition: 'all 0.3s'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: isMobile ? 'var(--sidebar-w)' : (sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-mini-w)'),
        background: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 120,
        transform: (isMobile && !sidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{
          height: 'var(--header-h)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 6,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {/* Clean abstract BDA logo text or SVG shape placeholder */}
              <div style={{ color: 'var(--primary)', fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.05em' }}>
                BDA
              </div>
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 12, fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em',
                  whiteSpace: 'nowrap', textTransform: 'uppercase'
                }}>Technologies</div>
              </motion.div>
            )}
          </div>

          {!isMobile && (
            <button 
              onClick={toggleSidebar} 
              style={{ 
                background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', 
                cursor: 'pointer', padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                marginLeft: sidebarOpen ? 0 : -4
              }}
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          )}

          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sidebar */}
        <nav style={{ padding: '24px 16px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ 
            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', 
            letterSpacing: '0.1em', padding: sidebarOpen ? '0 12px 16px' : '0 0 16px', 
            textTransform: 'uppercase', textAlign: sidebarOpen ? 'left' : 'center',
            whiteSpace: 'nowrap'
          }}>
            {sidebarOpen ? 'Main Menu' : '•••'}
          </div>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!sidebarOpen ? label : ''}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 6,
                marginBottom: 6,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              })}
            >
              <Icon size={20} opacity={0.8} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Need Help Box */}
        <div style={{ padding: '20px 16px', background: 'transparent' }}>
          {sidebarOpen ? (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 12, 
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: 6, borderRadius: 8 }}>
                  <User size={16} color="white" />
                </div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Need Help?</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 1.5 }}>
                Our support team is here to assist you.
              </div>
              <button style={{
                width: '100%', background: 'var(--primary)', color: 'white',
                border: 'none', padding: '8px 12px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                Contact Support <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <button style={{
              width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white',
              border: '1px solid rgba(255,255,255,0.1)', padding: '10px 0',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Framework */}
      <main style={{ 
        marginLeft: isMobile ? 0 : (sidebarOpen ? 'var(--sidebar-w)' : 'var(--sidebar-mini-w)'), 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
            {isMobile && (
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
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Welcome back, {user?.companyName || 'Admin'}! 👋
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Here's an overview of your payroll dashboard.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="btn-hover"
                style={{ 
                  width: 40, height: 40, borderRadius: 12, 
                  background: 'var(--primary)', color: 'white', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(88, 131, 59, 0.15)'
                }}
                title="Install Application"
              >
                <Download size={20} />
              </button>
            )}

            {/* Notification System */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                style={{ 
                  background: 'var(--bg)', border: '1px solid var(--border)', 
                  color: 'var(--text)', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 12, position: 'relative'
                }}
                className="btn-hover"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 18, height: 18, background: 'var(--primary)', color: 'white',
                    borderRadius: '50%', fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--surface)'
                  }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 50, right: 0, width: 360,
                  background: 'var(--surface)', borderRadius: 12,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid var(--border)',
                  zIndex: 200, padding: 0, overflow: 'hidden'
                }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>Notifications</div>
                    <button 
                      onClick={markAllAsRead}
                      style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No pending notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} style={{ padding: 20, borderBottom: '1px solid var(--border)', background: n.isRead ? 'var(--surface)' : 'var(--bg-alt)', opacity: n.isRead ? 0.7 : 1 }}>
                          <div 
                            onClick={() => {
                              markAsRead(n._id)
                              navigate('/leave-requests')
                              setNotifOpen(false)
                            }}
                            style={{ display: 'flex', gap: 12, marginBottom: 16, cursor: 'pointer' }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                              <User size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{n.staff?.fullName || 'Employee'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => handleLeaveAction(n.referenceId, 'Approved')}
                              style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleLeaveAction(n.referenceId, 'Rejected')}
                              style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Deny
                            </button>
                            <button 
                              onClick={() => archiveNotification(n._id)}
                              style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Control System */}
            <div style={{ 
              display: 'flex', background: 'var(--bg)', borderRadius: 6, 
              padding: 3, border: '1.5px solid var(--border)' 
            }}>
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    background: theme === t.id ? 'var(--bg)' : 'transparent',
                    color: theme === t.id ? 'var(--primary)' : 'var(--primary)',
                    boxShadow: theme === t.id ? 'var(--shadow-sm)' : 'none',
                    border: 'none', borderRadius: 11, padding: '7px 14px',
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
                  }}
                >
                  <t.icon size={15} strokeWidth={2.5} />
                </button>
              ))}
            </div>

            {/* User Profile / Logout */}
            <button 
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 8
              }}
              className="btn-hover"
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <User size={18} color="var(--primary)" />
              </div>
              {!isMobile && (
                <>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Admin</span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </>
              )}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
