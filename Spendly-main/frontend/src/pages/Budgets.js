import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Sparkles } from 'lucide-react';
import { Card, Btn, ProgressBar, fmtINR, EXPENSE_CATS, CAT_COLORS, Empty, SectionHeader, Spinner } from '../components/UI';
import API from '../utils/api';
import toast from 'react-hot-toast';

const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2 + i);
  return d.toISOString().slice(0, 7);
});

export default function Budgets() {
  const curMonth = new Date().toISOString().slice(0, 7);
  const [selMonth, setSelMonth] = useState(curMonth);
  const [budgets,  setBudgets]  = useState([]);
  const [actuals,  setActuals]  = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [bForm,    setBForm]    = useState({ category: 'Food & Dining', amount: '' });
  const [gForm,    setGForm]    = useState({ name: '', target: '', saved: '', deadline: '' });
  const [showBForm,  setShowBForm]  = useState(false);
  const [showGForm,  setShowGForm]  = useState(false);
  const [tab,        setTab]        = useState('budgets');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const loadBudgets = () => {
    API.get(`/budgets/?month=${selMonth}`).then(r => setBudgets(r.data));
    API.get(`/analytics/category-breakdown?month=${selMonth}`).then(r => setActuals(r.data));
  };
  const loadGoals = () => API.get('/goals/').then(r => setGoals(r.data));

  useEffect(() => { loadBudgets(); }, [selMonth]);
  useEffect(() => { loadGoals(); }, []);

  const saveBudget = async e => {
    e.preventDefault();
    if (!bForm.amount || Number(bForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    await API.post('/budgets/', { month: selMonth, category: bForm.category, amount: Number(bForm.amount) });
    toast.success('Budget saved!'); setShowBForm(false); loadBudgets();
  };

  const deleteBudget = async id => {
    await API.delete(`/budgets/${id}`);
    toast.success('Deleted'); loadBudgets();
  };

  const copyLastMonth = async () => {
    const r = await API.post('/budgets/copy-last-month', { month: selMonth });
    toast.success(r.data.message); loadBudgets();
  };

  // AI Budget Planner
  const generateAIBudget = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const { data } = await API.post('/ai/generate-budget');
      if (data.success && data.budgets?.length > 0) {
        setAiSuggestions(data.budgets);
        toast.success(`AI generated ${data.budgets.length} budget suggestions!`);
      } else {
        toast.error('Need more transaction history for AI suggestions');
      }
    } catch {
      toast.error('AI budget generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = async (suggestion) => {
    await API.post('/budgets/', { month: selMonth, category: suggestion.category, amount: suggestion.amount });
    toast.success(`Applied: ${suggestion.category} — ${fmtINR(suggestion.amount)}`);
    setAiSuggestions(s => s.filter(x => x.category !== suggestion.category));
    loadBudgets();
  };

  const applyAllSuggestions = async () => {
    for (const s of aiSuggestions) {
      await API.post('/budgets/', { month: selMonth, category: s.category, amount: s.amount });
    }
    toast.success('All AI budgets applied!');
    setAiSuggestions([]);
    loadBudgets();
  };

  const saveGoal = async e => {
    e.preventDefault();
    if (!gForm.name || !gForm.target) { toast.error('Fill name and target'); return; }
    await API.post('/goals/', { name: gForm.name, target: Number(gForm.target), saved: Number(gForm.saved || 0), deadline: gForm.deadline || null });
    toast.success('Goal created! 🎯');
    setGForm({ name: '', target: '', saved: '', deadline: '' });
    setShowGForm(false); loadGoals();
  };

  const updateGoalSaved = async (id, saved) => {
    await API.patch(`/goals/${id}`, { saved: Number(saved) });
    toast.success('Goal updated!'); loadGoals();
  };

  const deleteGoal = async id => {
    await API.delete(`/goals/${id}`);
    toast.success('Goal deleted'); loadGoals();
  };

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b]));
  const actualMap = Object.fromEntries(actuals.map(a => [a.category, a.total]));
  const allCats   = [...new Set([...Object.keys(budgetMap), ...Object.keys(actualMap)])].sort();
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = Object.values(actualMap).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="animate-fadeUp">
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Budgets & Goals</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Set limits, chase goals</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {['budgets', 'goals'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600,
            background: tab === t ? 'var(--accent)' : 'transparent',
            color: tab === t ? '#fff' : 'var(--text2)', cursor: 'pointer', transition: 'var(--transition)',
          }}>{t === 'budgets' ? '📋 Budgets' : '🎯 Goals'}</button>
        ))}
      </div>

      {tab === 'budgets' && (
        <>
          {/* Controls */}
          <Card className="animate-fadeUp delay-1">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ flex: '0 1 180px' }}>
                {months.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
              </select>
              <Btn onClick={() => setShowBForm(s => !s)}><Plus size={14} /> Set Budget</Btn>
              <Btn variant="secondary" onClick={copyLastMonth}><Copy size={14} /> Copy Last Month</Btn>
              <Btn variant="secondary" onClick={generateAIBudget} loading={aiLoading} style={{ border: '1px solid rgba(124,111,247,0.4)', color: 'var(--accent)' }}>
                <Sparkles size={14} /> AI Suggest Budgets
              </Btn>
            </div>

            {totalBudget > 0 && (
              <div style={{ display: 'flex', gap: 24, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Budgeted: </span><span style={{ fontWeight: 600 }}>{fmtINR(totalBudget)}</span></span>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Spent: </span><span style={{ color: 'var(--red)', fontWeight: 600 }}>{fmtINR(totalSpent)}</span></span>
                <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Left: </span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{fmtINR(totalBudget - totalSpent)}</span></span>
              </div>
            )}
          </Card>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.3)', background: 'rgba(124,111,247,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>✨ AI Budget Suggestions</h2>
                  <p style={{ fontSize: 12, color: 'var(--text2)' }}>Based on your last 3 months of spending</p>
                </div>
                <Btn onClick={applyAllSuggestions} style={{ fontSize: 12 }}>Apply All</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aiSuggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg3)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.category}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{s.reason}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmtINR(s.amount)}</span>
                      <Btn variant="secondary" onClick={() => applyAISuggestion(s)} style={{ fontSize: 11, padding: '6px 12px' }}>Apply</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Budget form */}
          {showBForm && (
            <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.3)' }}>
              <form onSubmit={saveBudget} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={lbl}>Category</label>
                  <select value={bForm.category} onChange={e => setBForm(f => ({ ...f, category: e.target.value }))}>
                    {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 140px' }}>
                  <label style={lbl}>Budget (₹)</label>
                  <input type="number" placeholder="e.g. 4000" value={bForm.amount} onChange={e => setBForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <Btn type="submit">Save</Btn>
                <Btn variant="ghost" onClick={() => setShowBForm(false)}>Cancel</Btn>
              </form>
            </Card>
          )}

          {/* Budget list */}
          {allCats.length === 0 ? (
            <Card><Empty icon="📋" message="No budgets set yet. Click 'Set Budget' or try 'AI Suggest Budgets'!" /></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allCats.map(cat => {
                const budget = budgetMap[cat]?.amount || 0;
                const spent  = actualMap[cat] || 0;
                const over   = budget > 0 && spent > budget;
                const catCol = CAT_COLORS[cat] || '#94a3b8';
                return (
                  <Card key={cat} className="animate-fadeUp" style={{ border: over ? '1px solid rgba(248,113,113,0.35)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: catCol }} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{cat}</span>
                        {over && <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.15)', color: 'var(--red)', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>Over budget</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                          <span style={{ color: over ? 'var(--red)' : 'var(--text)', fontWeight: 600 }}>{fmtINR(spent)}</span>
                          {budget > 0 && ` / ${fmtINR(budget)}`}
                        </span>
                        {budgetMap[cat] && (
                          <button onClick={() => deleteBudget(budgetMap[cat].id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', opacity: 0.5 }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--red)'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text2)'; }}
                          ><Trash2 size={13} /></button>
                        )}
                      </div>
                    </div>
                    {budget > 0 && <ProgressBar value={spent} max={budget} />}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'goals' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={() => setShowGForm(s => !s)}><Plus size={14} /> New Goal</Btn>
          </div>

          {showGForm && (
            <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.3)' }}>
              <SectionHeader title="Add Savings Goal" />
              <form onSubmit={saveGoal}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  {[
                    { key: 'name',     label: 'Goal Name',        type: 'text',   placeholder: 'New Laptop' },
                    { key: 'target',   label: 'Target (₹)',       type: 'number', placeholder: '50000'      },
                    { key: 'saved',    label: 'Already Saved (₹)', type: 'number', placeholder: '0'         },
                    { key: 'deadline', label: 'Target Date',      type: 'date',   placeholder: ''           },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <input type={type} placeholder={placeholder} value={gForm[key]} onChange={e => setGForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <Btn type="submit">Create Goal</Btn>
                  <Btn variant="ghost" onClick={() => setShowGForm(false)}>Cancel</Btn>
                </div>
              </form>
            </Card>
          )}

          {goals.length === 0 ? (
            <Card><Empty icon="🎯" message="No goals yet. Create one to start saving!" /></Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {goals.map(g => {
                const pct  = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
                const left = Math.max(g.target - g.saved, 0);
                const daysLeft   = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
                const monthsLeft = daysLeft ? Math.max(Math.ceil(daysLeft / 30), 1) : null;
                return (
                  <Card key={g.id} className="animate-fadeUp">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</div>
                        {g.deadline && <div style={{ fontSize: 11, color: daysLeft < 0 ? 'var(--red)' : 'var(--text2)', marginTop: 3 }}>{daysLeft < 0 ? '⚠️ Overdue' : `${daysLeft}d left`}</div>}
                      </div>
                      <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', opacity: 0.5 }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--red)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text2)'; }}
                      ><Trash2 size={14} /></button>
                    </div>

                    <ProgressBar value={g.saved} max={g.target} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtINR(g.saved)} saved</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{Math.round(pct)}%</span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtINR(g.target)} goal</span>
                    </div>

                    {monthsLeft && left > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', background: 'rgba(124,111,247,0.1)', borderRadius: 7, padding: '6px 10px', marginBottom: 12 }}>
                        💡 Save {fmtINR(Math.ceil(left / monthsLeft))}/month to reach this goal
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" placeholder="Update saved amount" style={{ flex: 1, fontSize: 12 }} id={`gs-${g.id}`} defaultValue={g.saved} />
                      <Btn variant="secondary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => updateGoalSaved(g.id, document.getElementById(`gs-${g.id}`).value)}>Update</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };
