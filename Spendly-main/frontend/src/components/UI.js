import { BarChart2, PieChart, Target, CreditCard } from 'lucide-react';

// Card
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={`animate-fadeUp ${className}`} style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 22px',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      ...style
    }}>
      {children}
    </div>
  );
}

// MetricCard
export function MetricCard({ label, value, sub, subColor, icon, delay = 0 }) {
  return (
    <Card className={`delay-${delay}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {icon && <span style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px', animation: 'countUp 0.4s ease both' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: subColor || 'var(--text2)' }}>{sub}</div>}
    </Card>
  );
}

// Button
export function Btn({ children, onClick, variant = 'primary', style = {}, loading = false, type = 'button', fullWidth = false }) {
  const styles = {
    primary:  { background: 'var(--accent)', color: '#fff', border: 'none' },
    secondary:{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)' },
    danger:   { background: 'rgba(248,113,113,0.15)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' },
    ghost:    { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={loading} style={{
      ...styles[variant],
      padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'var(--transition)', width: fullWidth ? '100%' : 'auto',
      ...style,
    }}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

// Badge
export function Badge({ children, color = 'purple' }) {
  const colors = {
    purple: { bg: 'rgba(16,185,129,0.15)', text: 'var(--accent2)' },
    green:  { bg: 'rgba(52,211,153,0.15)',  text: 'var(--green)'   },
    red:    { bg: 'rgba(248,113,113,0.15)', text: 'var(--red)'     },
    amber:  { bg: 'rgba(251,191,36,0.15)',  text: 'var(--amber)'   },
  };
  const c = colors[color] || colors.purple;
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 6, letterSpacing: '0.02em',
    }}>{children}</span>
  );
}

// Spinner
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, border: `2px solid var(--border2)`,
      borderTopColor: 'var(--accent)', borderRadius: '50%',
    }} className="animate-spin" />
  );
}

// ProgressBar
export function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = color || (pct >= 100 ? 'var(--red)' : pct >= 75 ? 'var(--amber)' : 'var(--green)');
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 99,
        background: barColor, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

// Empty state
export function Empty({ message = 'No data yet', icon }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text2)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
        {icon || <BarChart2 size={36} />}
      </div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

// Section header
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
      {action}
    </div>
  );
}

// Format INR
export function fmtINR(amount) {
  const n = Math.round(Number(amount) || 0);
  const s = Math.abs(n).toString();
  let result = s.slice(-3);
  let rest = s.slice(0, -3);
  while (rest.length > 2) { result = rest.slice(-2) + ',' + result; rest = rest.slice(0, -2); }
  if (rest) result = rest + ',' + result;
  return (n < 0 ? '-₹' : '₹') + result;
}

// Category colors
export const CAT_COLORS = {
  'Food & Dining':    '#f59e0b',
  'Transport':        '#38bdf8',
  'Shopping':         '#a78bfa',
  'Entertainment':    '#fb7185',
  'Utilities':        '#34d399',
  'Health':           '#f97316',
  'Education':        '#818cf8',
  'Rent':             '#e879f9',
  'Personal Care':    '#2dd4bf',
  'Travel':           '#facc15',
  'Investments':      '#4ade80',
  'Salary':           '#6ee7b7',
  'Freelance':        '#93c5fd',
  'Business':         '#fcd34d',
  'Other':            '#94a3b8',
};

export const EXPENSE_CATS = ['Food & Dining','Transport','Shopping','Entertainment','Utilities','Health','Education','Rent','Personal Care','Travel','Investments','Other'];
export const INCOME_CATS  = ['Salary','Freelance','Business','Investment Returns','Gift','Other Income'];