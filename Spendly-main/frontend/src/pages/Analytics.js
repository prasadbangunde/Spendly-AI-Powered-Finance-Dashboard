import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Card, SectionHeader, fmtINR, CAT_COLORS, Empty, Spinner, Btn } from '../components/UI';
import API from '../utils/api';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text)', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmtINR(p.value) : `${p.value}${p.name?.includes('Rate') ? '%' : ''}`}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [monthly,   setMonthly]   = useState([]);
  const [cats,      setCats]      = useState([]);
  const [selMonth,  setSelMonth]  = useState(new Date().toISOString().slice(0, 7));
  const [monthData, setMonthData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [report,    setReport]    = useState('');
  const [reportStats, setReportStats] = useState(null);
  const [loadingReport,  setLoadingReport]  = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('trends');

  useEffect(() => {
    Promise.all([
      API.get('/analytics/monthly-summary'),
      API.get('/analytics/category-breakdown'),
    ]).then(([m, c]) => {
      setMonthly(m.data);
      setCats(c.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    API.get(`/analytics/category-breakdown?month=${selMonth}`).then(r => {
      const total = r.data.reduce((s, x) => s + x.total, 0);
      setMonthData({ cats: r.data, total });
    });
  }, [selMonth]);

  const loadAnomalies = () => {
    setLoadingAnomalies(true);
    API.get('/ai/anomalies').then(r => setAnomalies(r.data.anomalies || [])).finally(() => setLoadingAnomalies(false));
  };

  const generateReport = async () => {
    setLoadingReport(true);
    setReport('');
    try {
      const { data } = await API.post('/ai/monthly-report', { month: selMonth });
      if (data.success) {
        setReport(data.report);
        setReportStats(data.stats);
      } else {
        setReport('Could not generate report. Please try again.');
      }
    } catch {
      setReport('Error connecting to AI. Make sure backend is running.');
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spendly_report_${selMonth}.txt`;
    a.click();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>;

  const insights = [];
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const delta = last.expense - prev.expense;
    insights.push({ icon: delta > 0 ? '🔴' : '🟢', text: delta > 0 ? `Spending rose ${fmtINR(Math.abs(delta))} vs last month` : `Spending fell ${fmtINR(Math.abs(delta))} vs last month — great job!`, type: delta > 0 ? 'warn' : 'good' });
    const avgRate = monthly.reduce((s, m) => s + m.savings_rate, 0) / monthly.length;
    insights.push({ icon: avgRate >= 20 ? '🟢' : '🟡', text: avgRate >= 20 ? `Average savings rate ${avgRate.toFixed(1)}% — above 20% benchmark!` : `Average savings rate ${avgRate.toFixed(1)}%. Try to reach 20%.`, type: avgRate >= 20 ? 'good' : 'warn' });
  }
  if (cats.length > 0) {
    const top = cats[0];
    const total = cats.reduce((s, c) => s + c.total, 0);
    insights.push({ icon: '📊', text: `Biggest spend: ${top.category} at ${((top.total / total) * 100).toFixed(1)}% (${fmtINR(top.total)})`, type: 'info' });
  }

  const ic = { good: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' }, warn: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' }, info: { bg: 'rgba(124,111,247,0.08)', border: 'rgba(124,111,247,0.25)' } };
  const months = [...new Set(monthly.map(m => m.month))];

  const tabs = [
    { id: 'trends',    label: '📊 Trends'          },
    { id: 'deepdive',  label: '📅 Deep Dive'        },
    { id: 'insights',  label: '🏆 Insights'         },
    { id: 'anomalies', label: '⚠️ Anomaly Detector' },
    { id: 'report',    label: '📄 AI Report'        },
    { id: 'export',    label: '📤 Export'           },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="animate-fadeUp">
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Analytics</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Deep dive into your spending patterns</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id === 'anomalies' && anomalies.length === 0) loadAnomalies(); }} style={{
            padding: '8px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600,
            background: activeTab === t.id ? 'var(--accent)' : 'transparent',
            color: activeTab === t.id ? '#fff' : 'var(--text2)', cursor: 'pointer', transition: 'var(--transition)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* TRENDS */}
      {activeTab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp">
            <SectionHeader title="Income vs Expenses" />
            {monthly.length === 0 ? <Empty icon="📈" message="Add transactions to see trends" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthly} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="income"  name="Income"   fill="#34d399" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[4,4,0,0]} />
                  <Bar dataKey="savings" name="Savings"  fill="#7c6ff7" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {monthly.length > 1 && (
            <Card className="animate-fadeUp">
              <SectionHeader title="Savings Rate Trend" />
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthly}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<TT />} />
                  <Line type="monotone" dataKey="savings_rate" name="Savings Rate" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* DEEP DIVE */}
      {activeTab === 'deepdive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Monthly Deep Dive</h2>
              <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ width: 'auto', fontSize: 13 }}>
                {months.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
              </select>
            </div>
            {!monthData || monthData.cats.length === 0 ? <Empty icon="📅" message="No data for this month" /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={monthData.cats} dataKey="total" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {monthData.cats.map((c, i) => <Cell key={i} fill={CAT_COLORS[c.category] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtINR(v)} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {monthData.cats.map((c, i) => {
                    const pct = monthData.total > 0 ? (c.total / monthData.total * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[c.category] || '#94a3b8', display: 'inline-block' }} />
                            {c.category}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtINR(c.total)} <span style={{ color: 'var(--text2)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 5 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: CAT_COLORS[c.category] || '#94a3b8', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* INSIGHTS */}
      {activeTab === 'insights' && (
        <Card className="animate-fadeUp">
          <SectionHeader title="Smart Insights" />
          {insights.length === 0 ? <Empty icon="🔍" message="Add more transactions to unlock insights" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ background: ic[ins.type].bg, border: `1px solid ${ic[ins.type].border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ANOMALY DETECTOR */}
      {activeTab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp" style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>⚠️ Spending Anomaly Detector</h2>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>AI flags transactions that are unusually high compared to your average</p>
              </div>
              <Btn variant="secondary" onClick={loadAnomalies} loading={loadingAnomalies} style={{ fontSize: 12 }}>
                Refresh
              </Btn>
            </div>
          </Card>

          {loadingAnomalies ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
          ) : anomalies.length === 0 ? (
            <Card><Empty icon="✅" message="No anomalies detected — your spending looks normal!" /></Card>
          ) : (
            anomalies.map((a, i) => (
              <Card key={i} className="animate-fadeUp" style={{ border: '1px solid rgba(251,191,36,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{a.date} · {a.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--amber)', background: 'rgba(251,191,36,0.1)', padding: '6px 10px', borderRadius: 7 }}>
                        {a.message}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)' }}>{fmtINR(a.amount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{a.times_higher}x average</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* AI MONTHLY REPORT */}
      {activeTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>✨ AI Monthly Report</h2>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>Get a full AI-written financial analysis for any month</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ fontSize: 13, width: 'auto' }}>
                  {months.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
                </select>
                <Btn onClick={generateReport} loading={loadingReport}>
                  ✨ Generate Report
                </Btn>
              </div>
            </div>

            {reportStats && (
              <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Income: </span><span style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtINR(reportStats.income)}</span></span>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Expenses: </span><span style={{ color: 'var(--red)', fontWeight: 700 }}>{fmtINR(reportStats.expense)}</span></span>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Savings: </span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmtINR(reportStats.savings)}</span></span>
              </div>
            )}
          </Card>

          {loadingReport && (
            <Card className="animate-fadeUp">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
                <Spinner />
                <span style={{ color: 'var(--text2)', fontSize: 14 }}>AI is analysing your finances and writing your report...</span>
              </div>
            </Card>
          )}

          {report && !loadingReport && (
            <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Your Report</h2>
                <Btn variant="secondary" onClick={downloadReport} style={{ fontSize: 12 }}>⬇️ Download</Btn>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', background: 'var(--bg3)', padding: 20, borderRadius: 10, border: '1px solid var(--border)' }}>
                {report}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* EXPORT */}
      {activeTab === 'export' && (
        <Card className="animate-fadeUp">
          <SectionHeader title="Export Data" />
          <button onClick={() => {
            API.get('/transactions/').then(r => {
              const rows = r.data.map(t => `${t.date},${t.description},${t.amount},${t.type},${t.category}`).join('\n');
              const blob = new Blob([`date,description,amount,type,category\n${rows}`], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `spendly_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
            });
          }} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--accent)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ⬇️ Download all transactions as CSV
          </button>
        </Card>
      )}
    </div>
  );
}
