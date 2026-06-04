import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Card, Spinner, fmtINR } from '../components/UI';
import API from '../utils/api';

const SUGGESTIONS = [
  "Why am I overspending this month?",
  "How can I save more money?",
  "Which category should I cut down?",
  "Give me a savings plan for next month",
  "Am I on track with my budget?",
  "What's my biggest expense this month?",
];

export default function AICoach() {
  const [messages,  setMessages]  = useState([{
    role: 'assistant',
    content: "Hi! I'm your Spendly AI Finance Coach 👋\n\nI've analysed your transaction data and I'm ready to help you make smarter financial decisions. Ask me anything about your spending, savings, or budgets!",
  }]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { data } = await API.post('/ai/chat', { message: msg, history });
      setMessages(m => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I couldn't connect. Make sure the backend is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fadeUp">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>AI Finance Coach</h1>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Your personal finance advisor · Analyses your real spending data</p>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => send(s)} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            color: 'var(--text2)', padding: '7px 14px', borderRadius: 99,
            fontSize: 12, cursor: 'pointer', transition: 'var(--transition)',
            fontFamily: 'var(--font)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
          >{s}</button>
        ))}
      </div>

      {/* Chat window */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 460, overflowY: 'auto', padding: '20px 20px 8px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, marginBottom: 20,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeUp 0.3s ease both',
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                  : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
              }}>
                {msg.role === 'user'
                  ? <User size={16} color="#fff" />
                  : <Bot size={16} color="var(--accent)" />
                }
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                padding: '12px 16px', borderRadius: msg.role === 'user'
                  ? '14px 4px 14px 14px'
                  : '4px 14px 14px 14px',
                fontSize: 14, lineHeight: 1.7,
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg3)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '1px solid var(--border)',
              }}>
                <Bot size={16} color="var(--accent)" />
              </div>
              <div style={{
                background: 'var(--bg3)', padding: '12px 16px', borderRadius: '4px 14px 14px 14px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Spinner size={14} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Analysing your finances...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about your finances... (Press Enter to send)"
            style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10 }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            width: 40, height: 40, borderRadius: 10, border: 'none',
            background: input.trim() ? 'var(--accent)' : 'var(--bg3)',
            color: input.trim() ? '#fff' : 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default', transition: 'var(--transition)',
            flexShrink: 0,
          }}>
            <Send size={16} />
          </button>
        </div>
      </Card>

      <p style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
        AI responses are based on your transaction data. Always verify important financial decisions.
      </p>
    </div>
  );
}
