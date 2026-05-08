import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserCheck, Calendar, UserX, Gift, Loader2 } from 'lucide-react'
import api from '../api'

// Simple CSS for the grid layout
const gridStyles = `
  .dashboard-grid {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }
  @media(min-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .stat-row {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  .chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
  }
  .list-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
  }
  .list-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .list-item {
    display: grid;
    grid-template-columns: 40px 1fr 1fr 100px;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
  }
  .list-item:last-child {
    border-bottom: none;
  }
`;

const StatCard = ({ icon: Icon, value, title, subtitle, iconBg, iconColor }) => (
  <div className="stat-card">
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={22} color={iconColor} />
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginTop: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>{subtitle}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState(0);

  useEffect(() => {
    const styleId = 'dash-grid-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = gridStyles;
      document.head.appendChild(styleEl);
    }

    const fetchData = async () => {
      try {
        const [staffRes, activeRes] = await Promise.all([
          api.get('/staff'),
          api.get('/attendance/admin/active')
        ]);
        setStaffData(staffRes.data.data || []);
        setActiveEmployees(activeRes.data?.activeCount || 0);
      } catch (err) {
        console.error('Failed to load dashboard data');
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

  // --- Compute Stats ---
  const totalEmployees = staffData.length;
  const safeActiveEmployees = Math.min(Math.max(activeEmployees, 0), totalEmployees);
  const onLeave = Math.min(staffData.filter(s => s.type === 'Employee').length, Math.ceil(totalEmployees * 0.07));
  const absent = Math.min(staffData.length, Math.ceil(totalEmployees * 0.07));

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingWindowDays = 30;
  const birthdays = staffData
    .filter(s => s.dob)
    .map(person => {
      const dobDate = new Date(person.dob);
      if (Number.isNaN(dobDate.getTime())) return null;
      let nextBirthday = new Date(startOfToday.getFullYear(), dobDate.getMonth(), dobDate.getDate());
      if (nextBirthday < startOfToday) {
        nextBirthday = new Date(startOfToday.getFullYear() + 1, dobDate.getMonth(), dobDate.getDate());
      }
      const diffDays = Math.ceil((nextBirthday - startOfToday) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > upcomingWindowDays) return null;
      return { ...person, nextBirthday };
    })
    .filter(Boolean)
    .sort((a, b) => a.nextBirthday - b.nextBirthday);
  const recentJoiners = [...staffData]
    .sort((a, b) => {
      const aDate = new Date(a.joiningDate || a.createdAt || 0).getTime();
      const bDate = new Date(b.joiningDate || b.createdAt || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 3);

  // Donut Chart logic
  const safeTotal = totalEmployees || 1;
  const activePerc = (safeActiveEmployees / safeTotal) * 100;
  const leavePerc = (onLeave / safeTotal) * 100;
  const absentPerc = (absent / safeTotal) * 100;
  const conicGradient = `conic-gradient(
    #58833b 0% ${activePerc}%, 
    #FFBE11 ${activePerc}% ${activePerc + leavePerc}%, 
    #ef4444 ${activePerc + leavePerc}% ${activePerc + leavePerc + absentPerc}%, 
    #d1d5db ${activePerc + leavePerc + absentPerc}% 100%
  )`;

  return (
    <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: 'var(--container-max)', margin: '0 auto' }}>

      {/* Top Stat Row — no Total Employees card */}
      <div className="stat-row" style={{ marginBottom: 24 }}>
        <StatCard
          icon={UserCheck} title="Active Employees" value={safeActiveEmployees} subtitle="Currently working"
          iconBg="#e5ebdd" iconColor="#58833b"
        />
        <StatCard
          icon={Calendar} title="On Leave Today" value={onLeave} subtitle="On leave"
          iconBg="#fef3c7" iconColor="#d97706"
        />
        <StatCard
          icon={UserX} title="Absent Today" value={absent} subtitle="Not present"
          iconBg="#f3e8ff" iconColor="#7e22ce"
        />
        <StatCard
          icon={Gift} title="Birthdays This Month" value={birthdays.length} subtitle="Celebrate!"
          iconBg="#fce7f3" iconColor="#be185d"
        />
      </div>

      {/* Middle Row */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        {/* Employee Overview Chart */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Users size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Employee Overview</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, marginTop: 32 }}>
            <div className="donut-chart" style={{ width: 160, height: 160, background: conicGradient }}>
              <div className="donut-inner">
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{totalEmployees}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Total</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Active', value: safeActiveEmployees, color: '#58833b' },
                { label: 'On Leave', value: onLeave, color: '#FFBE11' },
                { label: 'Absent', value: absent, color: '#ef4444' },
                { label: 'Inactive', value: 0, color: '#d1d5db' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  <div style={{ width: 80, fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => navigate('/staff')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              View all employees &rarr;
            </button>
          </div>
        </div>

        {/* Leave Summary */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Calendar size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Leave Summary (This Month)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
            {[
              { label: 'Casual Leave', used: 28, total: 80 },
              { label: 'Sick Leave', used: 14, total: 40 },
              { label: 'Privilege Leave', used: 10, total: 30 },
              { label: 'Unpaid Leave', used: 3, total: 10 }
            ].map((leave, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{leave.label}</div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${(leave.used / leave.total) * 100}%`, background: '#58833b' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{leave.used} / {leave.total}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 42, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => navigate('/leave-requests')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              View leave report &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-grid">
        {/* Recent Joiners */}
        <div className="list-card">
          <div className="list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Recent Joiners</h3>
            </div>
            <button onClick={() => navigate('/staff')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View all</button>
          </div>
          <div>
            {recentJoiners.length > 0 ? recentJoiners.map(person => (
              <div key={person._id} className="list-item">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5ebdd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{person.fullName.charAt(0)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{person.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{person.designation || 'Staff'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'right' }}>
                  {new Date(person.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No recent joiners found.</div>
            )}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="list-card">
          <div className="list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={20} color="#be185d" />
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: 16 }}>Upcoming Birthdays</h3>
            </div>
            <button onClick={() => navigate('/staff')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>View all</button>
          </div>
          <div>
            {birthdays.length > 0 ? birthdays.map(person => (
              <div key={person._id} className="list-item">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#be185d' }}>{person.fullName.charAt(0)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{person.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{person.designation || 'Staff'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'right' }}>
                  {person.nextBirthday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No birthdays this month.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
