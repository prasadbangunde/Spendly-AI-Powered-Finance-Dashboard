import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Receipt, BarChart2, Target, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MetricCard, Card, SectionHeader, ProgressBar, fmtINR, CAT_COLORS, Empty, Spinner } from '../components/UI';
import API from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {fmtINR(p.value)}</div>
      ))}
    </div>
  );
};

export default function Overview() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [monthly,  setMonthly]  = useState([]);
  const [cats,     setCats]     = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/transactions/summary/current-month'),
      API.get('/analytics/monthly-summary'),
      API.get('/analytics/category-breakdown'),
      API.get('/goals/'),
      API.get('/transactions/?'),
    ]).then(([s, m, c, g, t]) => {
      setStats(s.data);
      setMonthly(m.data.map(r => ({ ...r, month: r.month.slice(0, 7) })));
      setCats(c.data.slice(0, 6));
      setGoals(g.data.slice(0, 3));
      setRecent(t.data.slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="animate-fadeUp">
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Here's your financial snapshot</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <MetricCard delay={1} label="Income"       value={fmtINR(stats?.income  || 0)} icon={<TrendingUp size={18} color="var(--green)" />}  sub="This month" />
        <MetricCard delay={2} label="Expenses"     value={fmtINR(stats?.expense || 0)} icon={<TrendingDown size={18} color="var(--red)" />}   sub="This month" />
        <MetricCard delay={3} label="Savings"      value={fmtINR(stats?.savings || 0)} icon={<PiggyBank size={18} color="var(--accent)" />}
          sub={`${stats?.rate || 0}% savings rate`} subColor={stats?.rate >= 20 ? 'var(--green)' : 'var(--amber)'} />
        <MetricCard delay={4} label="Transactions" value={stats?.tx_count || 0}        icon={<Receipt size={18} color="var(--text2)" />}      sub="Expenses logged" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <Card className="delay-2">
          <SectionHeader title="Income vs Expenses" />
          {monthly.length === 0 ? <Empty icon={<BarChart2 size={36} />} message="Add transactions to see trends" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income"  name="Income"   fill="#34d399" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="delay-3">
          <SectionHeader title="Spending by Category" />
          {cats.length === 0 ? <Empty icon={<PieChart size={36} />} message="No expense data yet" /> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={cats} dataKey="total" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {cats.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.category] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtINR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cats.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[c.category] || '#94a3b8', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{c.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtINR(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {monthly.length > 1 && (
        <Card className="delay-3">
          <SectionHeader title="Savings Rate Trend" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="savings_rate" name="Savings Rate" stroke="var(--accent)" strokeWidth={2.5} fill="url(#savGrad)" dot={{ fill: 'var(--accent)', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Card className="delay-4">
          <SectionHeader title="Savings Goals" />
          {goals.length === 0 ? <Empty icon={<Target size={36} />} message="No goals yet — add one in Budgets" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {goals.map(g => {
                const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
                return (
                  <div key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{Math.round(pct)}%</span>
                    </div>
                    <ProgressBar value={g.saved} max={g.target} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtINR(g.saved)} saved</span>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtINR(g.target)} goal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="delay-5">
          <SectionHeader title="Recent Transactions" />
          {recent.length === 0 ? <Empty icon={<CreditCard size={36} />} message="No transactions yet" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[tx.category] || '#94a3b8', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{tx.date} · {tx.category}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
                    {tx.type === 'income' ? '+' : '-'}{fmtINR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}