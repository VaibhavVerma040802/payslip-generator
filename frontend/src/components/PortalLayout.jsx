import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, LogOut, User, Clock,
  CalendarDays, Menu, ChevronLeft, ChevronRight, Sun, Moon, Monitor, FileText, Bell, Loader2, CheckCheck, AlertTriangle
} from 'lucide-react'
import { useStaffPortal } from '../context/StaffPortalContext'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import PageTransition from './PageTransition'

const navItems = [
  { to: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portal/attendance', label: 'Attendance', icon: Clock },
  { to: '/portal/payslips', label: 'My Payslips', icon: FileText },
  { to: '/portal/summary', label: 'Weekly Summary', icon: CalendarDays },
  { to: '/portal/profile', label: 'My Profile', icon: User },
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

export default function PortalLayout() {
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const { staffUser, logout } = useStaffPortal()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    setSidebarOpen(!window.matchMedia('(max-width: 1024px)').matches)
  }, [])

  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [location.pathname, isMobile])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const fetchNotifications = async () => {
    setNotifLoading(true)
    try {
      const res = await api.get('/notifications/staff')
      setNotifications(res.data.data)
    } catch (err) {
      console.error('Notif error:', err)
    } finally {
      setNotifLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/staff/mark-all-read')
      fetchNotifications()
    } catch (err) {
      console.error('Failed to mark all as read')
    }
  }

  useEffect(() => {
    if (staffUser) fetchNotifications()
  }, [staffUser])

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
        mod.default('To install, click the Install icon in your browser menu or "Add to Home Screen" on your device.', { duration: 5000, icon: '💡' });
      });
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', transition: 'all 0.3s' }}>
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
          padding: sidebarOpen ? '0 24px' : '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 6,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
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
                }}>Staff Portal</div>
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
                marginLeft: 0
              }}
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
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
            {sidebarOpen ? 'Work Tools' : '•••'}
          </div>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
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

        {/* User Profile Hook */}
        <div style={{
          padding: '20px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center', gap: 12, 
            padding: '12px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: 12, marginBottom: 12 
          }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 10, 
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={16} color="var(--primary)" />
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {staffUser?.fullName}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{staffUser?.designation}</div>
              </motion.div>
            )}
          </div>
          <button 
            onClick={logout}
            className="btn-secondary"
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', 
              border: '1px solid rgba(255,255,255,0.1)', padding: sidebarOpen ? '10px' : '10px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
            title={!sidebarOpen ? "Sign Out" : ""}
          >
            <LogOut size={16} /> {sidebarOpen && "Sign Out"}
          </button>
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
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', opacity: 0.9, letterSpacing: '-0.01em' }}>
              Staff Portal Console
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setShowNotif(!showNotif);
                  if(!showNotif) fetchNotifications();
                }}
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', 
                  color: 'var(--text)', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 12, transition: 'all 0.2s',
                  position: 'relative'
                }}
                className="btn-hover"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: 'var(--primary)', color: 'white', fontSize: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--surface)' }}>
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotif && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowNotif(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 12,
                        width: 340, background: 'var(--surface)', borderRadius: 14,
                        border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)',
                        zIndex: 100, overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Bell size={15} color="var(--primary)" />
                          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)' }}>Notifications</span>
                          {notifications.filter(n => !n.isRead).length > 0 && (
                            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
                              {notifications.filter(n => !n.isRead).length}
                            </span>
                          )}
                        </div>
                        <button onClick={markAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 11, fontWeight: 700 }}>
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      </div>
                      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {notifLoading ? (
                          <div style={{ padding: 40, textAlign: 'center' }}>
                            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            <Bell size={26} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const typeMap = {
                              LEAVE_REQUEST:  { icon: CalendarDays, bg: '#e0f2fe', color: '#0369a1' },
                              PAYSLIP_PUSHED: { icon: FileText,     bg: '#dcfce7', color: '#15803d' },
                              PROFILE_UPDATE: { icon: User,         bg: '#f3e8ff', color: '#7e22ce' },
                              ATTENDANCE_ALERT:{ icon: AlertTriangle, bg: '#fee2e2', color: '#dc2626' },
                              OTHER:          { icon: Bell,         bg: 'var(--bg)', color: 'var(--text-muted)' },
                            }
                            const { icon: Icon, bg, color } = typeMap[n.type] || typeMap.OTHER
                            return (
                              <div
                                key={n._id}
                                onClick={() => !n.isRead && markAsRead(n._id)}
                                style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'var(--surface)' : 'var(--bg-alt)', cursor: n.isRead ? 'default' : 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon size={16} color={color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{n.message}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4, fontWeight: 600 }}>
                                    {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
                <Monitor size={20} />
              </button>
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
          </div>
        </header>

        {/* Global Body */}
        <div style={{ flex: 1, position: 'relative', padding: 'clamp(16px, 4vw, 32px)', overflowX: 'hidden' }}>
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
