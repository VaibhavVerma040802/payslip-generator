import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, List, Menu,
  Settings, User, Users,
  Sun, Moon, ChevronLeft, ChevronRight, Send, Download, Bell, CalendarDays, Activity,
  LogOut, UserPlus, AlertTriangle, Loader2, FileText, UserCheck, CheckCheck
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
  { to: '/leave-requests', label: 'Leave & Attendance', icon: CalendarDays },
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
  const [isProcessing, setIsProcessing] = useState(null)
  const [pendingShifts, setPendingShifts] = useState([])
  const [showForcePunchModal, setShowForcePunchModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchPendingShifts()
      const interval = setInterval(() => { fetchNotifications(); fetchPendingShifts(); }, 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/admin')
      setNotifications(res.data.data)
    } catch (err) {
      console.error('Failed to fetch notifications')
    }
  }

  const fetchPendingShifts = async () => {
    try {
      const res = await api.get('/attendance/admin/pending')
      setPendingShifts(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch pending shifts')
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

  const archiveNotification = async (id) => {
    try {
      await api.put(`/notifications/${id}/archive`)
      fetchNotifications()
      toast.success('Notification archived')
    } catch (err) {
      toast.error('Failed to archive')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/admin/mark-all-read')
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

  const handleBulkEmail = async () => {
    const month = new Date().toLocaleString('en-US', { month: 'long' })
    const year = new Date().getFullYear()
    if (!window.confirm(`Email all unsent payslips for ${month} ${year}?`)) return
    setIsProcessing('email')
    try {
      const res = await api.post('/payslips/bulk-email-month', { month, year })
      toast.success(res.data.message)
    } catch { toast.error('Bulk email failed') } finally { setIsProcessing(null) }
  }

  const handleExportAttendance = async () => {
    setIsProcessing('export')
    try {
      const response = await api.get('/attendance/admin/export-csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Attendance_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link); link.click(); link.remove()
      toast.success('Attendance report downloaded')
    } catch { toast.error('Export failed') } finally { setIsProcessing(null) }
  }

  const handleForcePunchOut = async () => {
    setIsProcessing('punch')
    try {
      const res = await api.post('/attendance/admin/force-punch-out')
      toast.success(res.data.message)
      setShowForcePunchModal(false)
      fetchPendingShifts()
    } catch { toast.error('Force punch-out failed') } finally { setIsProcessing(null) }
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

        {/* Quick Actions Sidebar Section */}
        <div style={{ padding: '0 14px 12px' }}>
          {sidebarOpen && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', padding: '0 10px 8px', textTransform: 'uppercase' }}>
              Quick Actions
            </div>
          )}
          {[
            { id: 'email', icon: Send, label: 'Bulk Email Slips', action: handleBulkEmail },
            { id: 'export', icon: Download, label: 'Export Attendance', action: handleExportAttendance },
            { id: 'punch', icon: LogOut, label: 'Force Punch-Out', action: () => { fetchPendingShifts(); setShowForcePunchModal(true); } },
            { id: 'staff', icon: UserPlus, label: 'Add New Staff', action: () => navigate('/staff') },
          ].map(({ id, icon: Icon, label, action }) => (
            <button
              key={id}
              onClick={action}
              disabled={isProcessing !== null}
              title={!sidebarOpen ? label : ''}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)', color: isProcessing === id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                padding: sidebarOpen ? '8px 12px' : '8px 0',
                marginBottom: 4, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: 8, fontSize: 12, fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {isProcessing === id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} /> : <Icon size={14} style={{ flexShrink: 0 }} />}
              {sidebarOpen && label}
            </button>
          ))}

          {/* Logout button */}
          <button
            onClick={logout}
            title={!sidebarOpen ? 'Sign Out' : ''}
            style={{
              width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
              padding: sidebarOpen ? '8px 12px' : '8px 0', marginTop: 4,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: 8, fontSize: 12, fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Sign Out'}
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
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 190 }} onClick={() => setNotifOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 50, right: 0, width: 380,
                    background: 'var(--surface)', borderRadius: 14,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.18)', border: '1px solid var(--border)',
                    zIndex: 200, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>Notifications</span>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
                            {notifications.filter(n => !n.isRead).length} new
                          </span>
                        )}
                      </div>
                      <button onClick={markAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    </div>
                    <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          <Bell size={28} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => {
                          const typeMap = {
                            LEAVE_REQUEST:   { icon: CalendarDays, bg: '#e0f2fe', color: '#0369a1', nav: '/leave-requests' },
                            STAFF_CREATED:   { icon: UserCheck,    bg: '#dcfce7', color: '#15803d', nav: '/staff' },
                            PAYSLIP_PUSHED:  { icon: FileText,     bg: '#fef3c7', color: '#b45309', nav: '/payslips' },
                            PROFILE_UPDATE:  { icon: User,         bg: '#f3e8ff', color: '#7e22ce', nav: '/staff' },
                            ATTENDANCE_ALERT:{ icon: AlertTriangle, bg: '#fee2e2', color: '#dc2626', nav: '/leave-requests' },
                            OTHER:           { icon: Bell,         bg: 'var(--bg)', color: 'var(--text-muted)', nav: '/' },
                          }
                          const { icon: Icon, bg, color, nav } = typeMap[n.type] || typeMap.OTHER
                          return (
                            <div key={n._id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'var(--surface)' : 'var(--bg-alt)' }}>
                              <div
                                onClick={() => { markAsRead(n._id); navigate(nav); setNotifOpen(false) }}
                                style={{ display: 'flex', gap: 12, cursor: 'pointer', marginBottom: n.type === 'LEAVE_REQUEST' && !n.isRead ? 10 : 0 }}
                              >
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon size={17} color={color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {n.staff?.fullName && (
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{n.staff.fullName}</div>
                                  )}
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{n.message}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>
                                    {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                              </div>
                              {n.type === 'LEAVE_REQUEST' && !n.isRead && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                  <button onClick={() => handleLeaveAction(n.referenceId, 'Approved')} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'var(--primary)', color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                    Approve
                                  </button>
                                  <button onClick={() => handleLeaveAction(n.referenceId, 'Rejected')} style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                    Deny
                                  </button>
                                  <button onClick={() => archiveNotification(n._id)} style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer' }}>
                                    Archive
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </>
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

            {/* Removed Admin profile button per user request */}
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

      {/* Force Punch-Out Modal */}
      {showForcePunchModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowForcePunchModal(false)} />
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 520, position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={20} color="#dc2626" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Force Punch-Out</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Close all stale open shifts from previous days</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 28px', maxHeight: 320, overflowY: 'auto' }}>
              {pendingShifts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                  <AlertTriangle size={32} color="#d97706" style={{ marginBottom: 8 }} />
                  <div>No stale open shifts found. All employees have punched out.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>The following {pendingShifts.length} employee shift(s) will be force-closed:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingShifts.map(shift => (
                      <div key={shift._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#dc2626', flexShrink: 0 }}>
                          {shift.staff?.fullName?.charAt(0) || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{shift.staff?.fullName || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shift.staff?.employeeId} · Punched in: {shift.punchIn ? new Date(shift.punchIn).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                        </div>
                        <span style={{ padding: '4px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Open</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowForcePunchModal(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              {pendingShifts.length > 0 && (
                <button
                  onClick={handleForcePunchOut}
                  disabled={isProcessing === 'punch'}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isProcessing === 'punch' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={16} />}
                  Confirm Force Punch-Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
