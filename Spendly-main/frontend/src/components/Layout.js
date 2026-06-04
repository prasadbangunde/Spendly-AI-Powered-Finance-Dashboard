import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Target, BarChart3, Bell, Sun, Moon, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../utils/api';

const nav = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview'     },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budgets',      icon: Target,          label: 'Budgets'      },
  { to: '/analytics',    icon: BarChart3,        label: 'Analytics'    },
  { to: '/ai-coach',     icon: Sparkles,         label: 'AI Coach',  isAI: true },
];

export default function Layout() {
  const { user, logout }    = useAuth();
  const { theme, toggle }   = useTheme();
  const [notifs, setNotifs]  = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [sideOpen, setSideOpen]     = useState(false);
  const location = useLocation();

  useEffect(() => { setSideOpen(false); }, [location]);
  useEffect(() => {
    API.get('/analytics/notifications').then(r => setNotifs(r.data)).catch(() => {});
  }, [location]);

  const unread   = notifs.filter(n => !n.is_read).length;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'SP';

  const markAllRead = () => {
    API.patch('/analytics/notifications/read-all').then(() => {
      setNotifs(n => n.map(x => ({ ...x, is_read: 1 })));
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 40, backdropFilter: 'blur(2px)'
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg2-solid)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
        transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }} className="sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}>
            ₹
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>Spendly</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(({ to, icon: Icon, label, isAI }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              color: isActive ? '#fff' : isAI ? 'var(--accent2)' : 'var(--text2)',
              background: isActive
                ? isAI ? 'linear-gradient(135deg, var(--accent), #059669)' : 'var(--accent)'
                : isAI ? 'rgba(16,185,129,0.08)' : 'transparent',
              transition: 'var(--transition)', textDecoration: 'none',
              border: isAI && !isActive ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
            })}>
              <Icon size={18} />
              {label}
              {isAI && <span style={{ fontSize: 9, background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 99, marginLeft: 'auto', fontWeight: 700 }}>AI</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 4px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 12px', borderRadius: 10, border: 'none',
            background: 'transparent', color: 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }} className="main-content">
        {/* Background depth effects */}
        <div className="bg-orbs" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        {/* Topbar */}
        <header style={{
          height: 60, background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', position: 'sticky', top: 0, zIndex: 30,
          backdropFilter: 'blur(12px)',
        }}>
          <button onClick={() => setSideOpen(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--text2)', padding: 6, borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggle} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifs(s => !s)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
                )}
              </button>

              {showNotifs && (
                <div style={{ position: 'absolute', right: 0, top: 44, width: 320, background: 'var(--bg2-solid)', border: '1px solid var(--border2)', borderRadius: 14, boxShadow: 'var(--shadow)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                    {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifs.length === 0
                      ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No notifications</div>
                      : notifs.map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.is_read ? 'transparent' : 'rgba(16,185,129,0.05)' }}>
                          <div style={{ fontSize: 12, color: n.type === 'warning' ? 'var(--amber)' : 'var(--text)', lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px 24px', overflowX: 'hidden', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { transform: translateX(0) !important; }
          .main-content { margin-left: 240px !important; }
        }
      `}</style>
    </div>
  );
}
