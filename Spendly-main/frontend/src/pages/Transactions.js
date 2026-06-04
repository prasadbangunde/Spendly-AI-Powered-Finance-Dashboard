import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, Upload, Download, Camera, Sparkles } from 'lucide-react';
import { Card, Btn, fmtINR, CAT_COLORS, EXPENSE_CATS, INCOME_CATS, Empty, Spinner, SectionHeader } from '../components/UI';
import API from '../utils/api';
import toast from 'react-hot-toast';

const emptyForm = { date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'expense', category: 'Food & Dining', notes: '' };

const getMonthOptions = () => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
};

export default function Transactions() {
  const [activeTab, setActiveTab] = useState('view');
  const [txs,       setTxs]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]       = useState(emptyForm);
  const [saving,    setSaving]     = useState(false);
  const [search,    setSearch]     = useState('');
  const [filter,    setFilter]     = useState({ type: 'All', category: 'All', month: 'All' });
  const [autocat,   setAutocat]    = useState('');
  // CSV
  const [csvFile,    setCsvFile]    = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importing,  setImporting]  = useState(false);
  // Receipt scanner
  const [scanning,   setScanning]   = useState(false);
  const [scanned,    setScanned]    = useState(null);
  // NL Search
  const [nlQuery,    setNlQuery]    = useState('');
  const [nlResults,  setNlResults]  = useState(null);
  const [nlLoading,  setNlLoading]  = useState(false);
  const [nlExplain,  setNlExplain]  = useState('');

  const monthOptions = getMonthOptions();

  const load = useCallback(() => {
    setLoading(true);
    API.get('/transactions/').then(r => setTxs(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (form.description.length > 2) {
      const t = setTimeout(() => {
        API.post('/transactions/categorize', { description: form.description })
          .then(r => { setAutocat(r.data.category); setForm(f => ({ ...f, category: r.data.category })); }).catch(() => {});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [form.description]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) { toast.error('Fill description and amount'); return; }
    setSaving(true);
    try {
      await API.post('/transactions/', { ...form, amount: Number(form.amount) });
      toast.success('Transaction saved! ✅');
      setForm(emptyForm); setAutocat(''); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      toast.success('Deleted');
      setTxs(t => t.filter(x => x.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  // CSV
  const handleCSVUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1, 6).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()])); });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const required = ['date', 'description', 'amount', 'type', 'category'];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length > 0) { toast.error(`Missing columns: ${missing.join(', ')}`); setImporting(false); return; }
      let success = 0, errors = 0;
      const rows = lines.slice(1).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()])); }).filter(r => r.date && r.description && r.amount);
      for (const row of rows) {
        try { await API.post('/transactions/', { date: row.date, description: row.description, amount: Number(row.amount), type: row.type || 'expense', category: row.category || 'Other', notes: row.notes || '' }); success++; }
        catch { errors++; }
      }
      toast.success(`✅ Imported ${success}${errors > 0 ? `, ${errors} failed` : ''}`);
      setCsvFile(null); setCsvPreview([]); load(); setImporting(false);
    };
    reader.readAsText(csvFile);
  };

  const downloadSample = () => {
    const csv = `date,description,amount,type,category,notes\n2026-04-01,Salary Credit,50000,income,Salary,\n2026-04-02,Zomato Order,450,expense,Food & Dining,Lunch\n2026-04-03,Ola Ride,120,expense,Transport,\n2026-04-04,Netflix,649,expense,Entertainment,`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spendly_sample.csv'; a.click();
  };

  // Receipt Scanner
  const handleReceiptUpload = async e => {
    const file = e.target.files[0]; if (!file) return;
    setScanning(true); setScanned(null);
    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      try {
        const { data } = await API.post('/ai/scan-receipt', { image_base64: base64, mime_type: mimeType });
        if (data.success) {
          setScanned(data.data);
          setForm(f => ({ ...f, description: data.data.description, amount: String(data.data.amount), date: data.data.date, category: data.data.category }));
          setActiveTab('add');
          toast.success('Receipt scanned! Review and save. ✅');
        } else {
          toast.error('Could not read receipt: ' + data.error);
        }
      } catch { toast.error('Receipt scanning failed'); }
      finally { setScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  // NL Search
  const handleNLSearch = async () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true); setNlResults(null);
    try {
      const { data } = await API.post('/ai/search', { query: nlQuery });
      setNlResults(data.results || []);
      setNlExplain(data.explanation || '');
    } catch { toast.error('Search failed'); }
    finally { setNlLoading(false); }
  };

  const filtered = txs.filter(tx => {
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase());
    const matchType  = filter.type === 'All' || tx.type === filter.type;
    const matchCat   = filter.category === 'All' || tx.category === filter.category;
    const matchMonth = filter.month === 'All' || tx.date.startsWith(filter.month);
    return matchSearch && matchType && matchCat && matchMonth;
  });

  const totalIn  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const tabs = [
    { id: 'add',     label: '+ Add Transaction'   },
    { id: 'receipt', label: '📷 Receipt Scanner'   },
    { id: 'search',  label: '🔍 AI Search'         },
    { id: 'import',  label: '⬆ Import CSV'         },
    { id: 'view',    label: '📋 View & Manage'     },
  ];

  const TxRow = ({ tx, i, list }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${CAT_COLORS[tx.category] || '#94a3b8'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: CAT_COLORS[tx.category] || '#94a3b8' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{tx.date} · {tx.category}{tx.notes ? ` · ${tx.notes}` : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>{tx.type === 'income' ? '+' : '-'}{fmtINR(tx.amount)}</span>
        <button onClick={() => handleDelete(tx.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', padding: 6, borderRadius: 7, display: 'flex', opacity: 0.4, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = 0.4; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'none'; }}
        ><Trash2 size={14} /></button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="animate-fadeUp">
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Transactions</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>Track every rupee in and out</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '9px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 600,
            background: activeTab === t.id ? 'var(--accent)' : 'transparent',
            color: activeTab === t.id ? '#fff' : 'var(--text2)', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ADD */}
      {activeTab === 'add' && (
        <Card className="animate-fadeUp" style={{ border: scanned ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(124,111,247,0.25)' }}>
          {scanned && <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--green)' }}>✅ Receipt scanned! Details filled automatically — review and save.</div>}
          <SectionHeader title="Add a Transaction" />
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={lbl}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category: e.target.value === 'income' ? 'Salary' : 'Food & Dining' }))}>
                  <option value="expense">💸 Expense</option>
                  <option value="income">💵 Income</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Description {autocat && <span style={{ color: 'var(--accent)', fontSize: 10, marginLeft: 8 }}>→ {autocat}</span>}</label>
                <input placeholder="e.g. Zomato Order" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Amount (₹)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Notes (optional)</label>
                <input placeholder="Any notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <Btn type="submit" loading={saving} style={{ minWidth: 160 }}>✅ Save Transaction</Btn>
              <Btn variant="ghost" onClick={() => { setForm(emptyForm); setAutocat(''); setScanned(null); }}>Clear</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* RECEIPT SCANNER */}
      {activeTab === 'receipt' && (
        <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.25)' }}>
          <SectionHeader title="📷 AI Receipt Scanner" />
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
            Take a photo or upload an image of any bill or receipt. AI will automatically extract the merchant, amount, date and category — then fill the transaction form for you.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 24px', border: `2px dashed ${scanning ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 14, cursor: 'pointer', background: scanning ? 'rgba(124,111,247,0.05)' : 'transparent', transition: 'var(--transition)' }}>
            {scanning ? (
              <>
                <Spinner size={32} />
                <span style={{ fontSize: 14, color: 'var(--accent)' }}>Scanning receipt with AI...</span>
              </>
            ) : (
              <>
                <Camera size={36} color="var(--text2)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Upload Receipt / Bill Photo</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Supports JPG, PNG — any bill, receipt, or invoice</div>
                </div>
                <span style={{ fontSize: 12, background: 'rgba(124,111,247,0.1)', color: 'var(--accent)', padding: '4px 14px', borderRadius: 99 }}>Click to upload</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleReceiptUpload} style={{ display: 'none' }} disabled={scanning} />
          </label>

          <div style={{ marginTop: 20, background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Works with:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Restaurant bills', 'Zomato receipts', 'Amazon invoices', 'Petrol slips', 'Medical bills', 'Shopping receipts', 'Utility bills'].map(t => (
                <span key={t} style={{ fontSize: 11, background: 'var(--bg2)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 99, color: 'var(--text2)' }}>{t}</span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* AI SEARCH */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp" style={{ border: '1px solid rgba(124,111,247,0.25)' }}>
            <SectionHeader title="🔍 Natural Language Search" />
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Search your transactions in plain English. No filters needed.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={nlQuery} onChange={e => setNlQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNLSearch()} placeholder='e.g. "food orders above ₹500 last month" or "all transport this week"' style={{ flex: 1 }} />
              <Btn onClick={handleNLSearch} loading={nlLoading} style={{ flexShrink: 0 }}>
                <Sparkles size={14} /> Search
              </Btn>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {['Zomato orders this month', 'Expenses above ₹1000', 'All income last month', 'Transport this week'].map(q => (
                <button key={q} onClick={() => { setNlQuery(q); }} style={{ fontSize: 11, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '4px 12px', borderRadius: 99, cursor: 'pointer' }}>{q}</button>
              ))}
            </div>
          </Card>

          {nlLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>}

          {nlResults !== null && !nlLoading && (
            <Card className="animate-fadeUp">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, marginBottom: 4 }}>🤖 {nlExplain}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{nlResults.length} transaction{nlResults.length !== 1 ? 's' : ''} found</div>
              </div>
              {nlResults.length === 0 ? <Empty icon="🔍" message="No matching transactions found" /> : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {nlResults.map((tx, i) => <TxRow key={tx.id} tx={tx} i={i} list={nlResults} />)}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* IMPORT CSV */}
      {activeTab === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp">
            <SectionHeader title="Import Bank Statement CSV" />
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Required CSV columns:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['date', 'description', 'amount', 'type', 'category'].map(col => (
                  <span key={col} style={{ background: 'rgba(124,111,247,0.15)', color: 'var(--accent2)', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 500 }}>{col}</span>
                ))}
              </div>
            </div>
            <button onClick={downloadSample} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--accent)', padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
              <Download size={14} /> Download Sample Template
            </button>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '36px 24px', border: `2px dashed ${csvFile ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 12, cursor: 'pointer', background: csvFile ? 'rgba(124,111,247,0.05)' : 'transparent', transition: 'var(--transition)' }}>
              <Upload size={28} color={csvFile ? 'var(--accent)' : 'var(--text2)'} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: csvFile ? 'var(--accent)' : 'var(--text)' }}>{csvFile ? csvFile.name : 'Click to upload CSV'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{csvFile ? `${(csvFile.size/1024).toFixed(1)} KB` : 'Supports .csv from any bank'}</div>
              </div>
              <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
            </label>
          </Card>

          {csvPreview.length > 0 && (
            <Card className="animate-fadeUp">
              <SectionHeader title={`Preview (first ${csvPreview.length} rows)`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{Object.keys(csvPreview[0]).map(h => <th key={h} style={{ padding: '8px 12px', color: 'var(--text2)', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>{h}</th>)}</tr></thead>
                  <tbody>{csvPreview.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>{Object.values(row).map((val, j) => <td key={j} style={{ padding: '10px 12px', color: 'var(--text)' }}>{val}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Btn onClick={handleCSVImport} loading={importing}>📥 Import All Rows</Btn>
                <Btn variant="ghost" onClick={() => { setCsvFile(null); setCsvPreview([]); }}>Cancel</Btn>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* VIEW & MANAGE */}
      {activeTab === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="animate-fadeUp delay-1">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: 4 }}>Month</label>
                <select value={filter.month} onChange={e => setFilter(f => ({ ...f, month: e.target.value }))}>
                  <option value="All">All months</option>
                  {monthOptions.map(m => <option key={m} value={m}>{new Date(m+'-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: 4 }}>Type</label>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
                  <option value="All">All types</option>
                  <option value="expense">💸 Expenses</option>
                  <option value="income">💵 Income</option>
                </select>
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: 4 }}>Category</label>
                <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                  <option value="All">All categories</option>
                  {[...EXPENSE_CATS, ...INCOME_CATS].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Income: </span><span style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtINR(totalIn)}</span></span>
              <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Expenses: </span><span style={{ color: 'var(--red)', fontWeight: 700 }}>{fmtINR(totalOut)}</span></span>
              <span style={{ fontSize: 13 }}><span style={{ color: 'var(--text2)' }}>Net: </span><span style={{ color: totalIn - totalOut >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{fmtINR(totalIn - totalOut)}</span></span>
              <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>{filtered.length} transactions</span>
            </div>
          </Card>

          <Card className="animate-fadeUp delay-2" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
            ) : filtered.length === 0 ? (
              <Empty icon="💳" message="No transactions found" />
            ) : (
              filtered.map((tx, i) => <TxRow key={tx.id} tx={tx} i={i} list={filtered} />)
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };
