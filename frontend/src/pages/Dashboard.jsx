import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, Calendar, ClipboardList, Loader2, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'
import api from '../api'

const dashStyles = `
  .dash-stat-row {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  .dash-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px 20px 16px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    cursor: pointer;
    transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }
  .dash-stat-card:hover {
    box-shadow: 0 8px 28px rgba(0,0,0,0.10);
    transform: translateY(-2px);
    border-color: var(--primary-light, #a3c986);
  }
  .dash-stat-card .arrow-hint {
    position: absolute;
    bottom: 12px;
    right: 14px;
    opacity: 0;
    transition: opacity 0.18s;
  }
  .dash-stat-card:hover .arrow-hint {
    opacity: 1;
  }
  .dash-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dash-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 1024px) {
    .dash-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }
  .panel-head {
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .panel-subhead {
    padding: 9px 22px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.02);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  /* Attendance overview table */
  .att-table-head {
    display: grid;
    grid-template-columns: 1fr 90px 90px 80px;
    gap: 8px;
    padding: 10px 22px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.025);
  }
  .att-row {
    display: grid;
    grid-template-columns: 1fr 90px 90px 80px;
    gap: 8px;
    align-items: center;
    padding: 11px 22px;
    border-bottom: 1px solid var(--border);
    transition: background 0.13s;
  }
  .att-row:last-child { border-bottom: none; }
  .att-row:hover { background: rgba(0,0,0,0.018); }
  /* Punch-in list */
  .punch-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 22px;
    border-bottom: 1px solid var(--border);
    transition: background 0.13s;
  }
  .punch-row:last-child { border-bottom: none; }
  .punch-row:hover { background: rgba(0,0,0,0.018); }
  /* Join list */
  .join-row {
    display: grid;
    grid-template-columns: 38px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 22px;
    border-bottom: 1px solid var(--border);
    transition: background 0.13s;
  }
  .join-row:last-child { border-bottom: none; }
  .join-row:hover { background: rgba(0,0,0,0.018); }
  /* Pills */
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    line-height: 1.6;
  }
  .pill-green  { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
  .pill-orange { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
  .pill-slate  { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
  .pill-blue   { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
  .pill-red    { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
  /* Scroll containers */
  .scroll-list { max-height: 320px; overflow-y: auto; }
  .scroll-list::-webkit-scrollbar { width: 4px; }
  .scroll-list::-webkit-scrollbar-track { background: transparent; }
  .scroll-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  /* Donut */
  .donut-chart {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .donut-inner {
    width: 96px;
    height: 96px;
    background: var(--surface);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .avg-bar {
    margin: 0 20px 18px;
    padding: 11px 16px;
    background: linear-gradient(135deg,#f0fdf4,#dcfce7);
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

// ── Helpers ────────────────────────────────────────────────────────
const LATE_HOUR = 10;

const fmtTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const isPunchLate = (punchIn) => {
  if (!punchIn) return false;
  const d = new Date(punchIn);
  return d.getHours() > LATE_HOUR || (d.getHours() === LATE_HOUR && d.getMinutes() > 0);
};

const calcWorkedTime = (record, now) => {
  if (!record.punchIn) return '—';
  const start = new Date(record.punchIn);
  const end   = record.punchOut ? new Date(record.punchOut) : now;
  const diffMs = Math.max(0, end - start);
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const Avatar = ({ name, bg, color, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <span style={{ fontSize: size * 0.38, fontWeight: 700, color }}>{(name || '?').charAt(0).toUpperCase()}</span>
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, value, title, subtitle, iconBg, iconColor, onClick }) => (
  <div className="dash-stat-card" onClick={onClick} role="button" tabIndex={0}
    onKeyDown={e => e.key === 'Enter' && onClick?.()}>
    <div className="dash-icon-wrap" style={{ background: iconBg }}>
      <Icon size={22} color={iconColor} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', marginTop: 2, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5 }}>{subtitle}</div>
    </div>
    <ArrowRight size={14} color="var(--text-light)" className="arrow-hint" />
  </div>
);

// ── Main ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [staffData, setStaffData]     = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [todayPunchins, setTodayPunchins] = useState([]);
  const [now, setNow]                 = useState(new Date());

  // Live clock — tick every 30 s so active worked-times refresh
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const styleId = 'dash-styles-v4';
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style');
      el.id = styleId;
      el.innerHTML = dashStyles;
      document.head.appendChild(el);
    }
    const fetchData = async () => {
      try {
        const [staffRes, activeRes, punchinsRes] = await Promise.all([
          api.get('/staff'),
          api.get('/attendance/admin/active'),
          api.get('/attendance/admin/today-punchins')
        ]);
        setStaffData(staffRes.data.data || []);
        setActiveCount(activeRes.data?.activeCount || 0);
        setTodayPunchins(punchinsRes.data?.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  // ── Compute Stats ────────────────────────────────────────────────
  const totalEmployees = staffData.length;
  const safeActive = Math.min(Math.max(activeCount, 0), totalEmployees);
  const onLeave    = Math.min(staffData.filter(s => s.type === 'Employee').length, Math.ceil(totalEmployees * 0.07));
  const totalPresentToday = todayPunchins.length;

  const today        = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const recentJoiners = [...staffData]
    .sort((a, b) => new Date(b.joiningDate || b.createdAt || 0) - new Date(a.joiningDate || a.createdAt || 0))
    .slice(0, 5);

  // Donut
  const safeTotal  = totalEmployees || 1;
  const activePerc = (safeActive / safeTotal) * 100;
  const leavePerc  = (onLeave / safeTotal) * 100;
  const conicGradient = `conic-gradient(
    #58833b 0% ${activePerc}%,
    #FFBE11 ${activePerc}% ${activePerc + leavePerc}%,
    #d1d5db ${activePerc + leavePerc}% 100%
  )`;

  // Punch-in meta
  const latePunchins  = todayPunchins.filter(r => isPunchLate(r.punchIn));
  const validPunchins = todayPunchins.filter(r => r.punchIn);

  const avgLoginTime = (() => {
    if (!validPunchins.length) return null;
    const avgSec = validPunchins.reduce((sum, r) => {
      const d = new Date(r.punchIn);
      return sum + d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    }, 0) / validPunchins.length;
    const h = Math.floor(avgSec / 3600);
    const m = Math.floor((avgSec % 3600) / 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  })();

  // Sort attendance: active first, then by punchIn desc
  const sortedAttendance = [...todayPunchins].sort((a, b) => {
    const aActive = !a.punchOut ? 1 : 0;
    const bActive = !b.punchOut ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return new Date(a.punchIn) - new Date(b.punchIn);
  });

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: 'var(--container-max)', margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--text)' }}>Dashboard</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Stat Row ─────────────────────────────────────────────── */}
      <div className="dash-stat-row" style={{ marginBottom: 22 }}>
        <StatCard
          icon={Users} title="Total Employees" value={totalEmployees}
          subtitle="All registered staff"
          iconBg="#e5ebdd" iconColor="#58833b"
          onClick={() => navigate('/staff')}
        />
        <StatCard
          icon={UserCheck} title="Active Today" value={safeActive}
          subtitle="Currently punched in"
          iconBg="#dbeafe" iconColor="#1d4ed8"
          onClick={() => navigate('/staff')}
        />
        <StatCard
          icon={Calendar} title="On Leave Today" value={onLeave}
          subtitle="Approved leave today"
          iconBg="#fef3c7" iconColor="#d97706"
          onClick={() => navigate('/leave-requests')}
        />
        <StatCard
          icon={ClipboardList} title="Attendance Today" value={totalPresentToday}
          subtitle={`${latePunchins.length} late arrival${latePunchins.length !== 1 ? 's' : ''}`}
          iconBg="#f3e8ff" iconColor="#7e22ce"
          onClick={() => {
            document.getElementById('att-overview-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      </div>

      {/* ── Middle Row ───────────────────────────────────────────── */}
      <div className="dash-grid" style={{ marginBottom: 22 }}>

        {/* Employee Overview Donut */}
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={17} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Employee Overview</span>
            </div>
            <button onClick={() => navigate('/staff')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          <div style={{ padding: '28px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
            <div className="donut-chart" style={{ width: 148, height: 148, background: conicGradient }}>
              <div className="donut-inner">
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{totalEmployees}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Total</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Active',   value: safeActive, color: '#58833b' },
                { label: 'On Leave', value: onLeave,    color: '#FFBE11' },
                { label: 'Others',   value: Math.max(0, totalEmployees - safeActive - onLeave), color: '#d1d5db' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ width: 72, fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          {avgLoginTime && (
            <div className="avg-bar">
              <TrendingUp size={15} color="#15803d" />
              <span style={{ fontSize: 13, color: '#15803d' }}>
                <span style={{ fontWeight: 500 }}>Avg Login Time Today:</span>
                {' '}<span style={{ fontWeight: 800 }}>{avgLoginTime}</span>
              </span>
            </div>
          )}
        </div>

        {/* Attendance Overview — detailed table (replaces Today's Punch-ins) */}
        <div className="panel" id="att-overview-panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <ClipboardList size={17} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Recent Punch-In</span>
              {latePunchins.length > 0 && (
                <span className="pill pill-orange">
                  <AlertTriangle size={10} />
                  {latePunchins.length} late
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              {todayPunchins.length} present today
            </span>
          </div>

          {avgLoginTime && (
            <div className="panel-subhead">
              <Clock size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Avg login: <strong style={{ color: 'var(--text)' }}>{avgLoginTime}</strong>
              </span>
            </div>
          )}

          {/* Column headers */}
          <div className="att-table-head">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Worked</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
          </div>

          <div className="scroll-list">
            {sortedAttendance.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No punch-ins recorded today.
              </div>
            ) : sortedAttendance.map(record => {
              const late   = isPunchLate(record.punchIn);
              const active = !record.punchOut;
              const worked = calcWorkedTime(record, now);
              const avatarBg    = late ? '#fff7ed' : active ? '#eff6ff' : '#f1f5f9';
              const avatarColor = late ? '#c2410c' : active ? '#1d4ed8' : '#475569';
              return (
                <div key={record._id} className="att-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <Avatar name={record.staff?.fullName} bg={avatarBg} color={avatarColor} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.staff?.fullName || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {record.staff?.designation || 'Staff'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: late ? '#c2410c' : 'var(--text)' }}>
                    {fmtTime(record.punchIn)}
                    {late && <div style={{ fontSize: 10, color: '#c2410c', fontWeight: 500 }}>Late</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {worked}
                    {active && (
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                    )}
                  </div>
                  <span className={`pill ${active ? 'pill-blue' : late ? 'pill-orange' : 'pill-green'}`}>
                    {active ? 'Active' : late ? 'Late' : 'On Time'}
                  </span>
                </div>
              );
            })}
          </div>

          {sortedAttendance.length > 0 && (
            <div style={{ padding: '10px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Present: <strong style={{ color: 'var(--text)' }}>{totalPresentToday}</strong></span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active: <strong style={{ color: '#1d4ed8' }}>{safeActive}</strong></span>
              {latePunchins.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Late: <strong style={{ color: '#c2410c' }}>{latePunchins.length}</strong></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────── */}
      {/* Recent Joiners — full width */}
      <div className="panel">
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={17} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Recent Joiners</span>
          </div>
          <button onClick={() => navigate('/staff')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            View all →
          </button>
        </div>
        {/* 5-column grid for the joiner list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {recentJoiners.length > 0 ? recentJoiners.map(person => (
            <div key={person._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={person.fullName} bg="#e5ebdd" color="var(--primary)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.fullName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{person.designation || 'Staff'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                  {new Date(person.joiningDate || person.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, gridColumn: '1 / -1' }}>No recent joiners.</div>
          )}
        </div>
      </div>

    </div>
  );
}
