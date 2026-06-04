import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState('');

  const pwLen = form.password.length;
  const pwStr = pwLen===0?0:pwLen<6?1:pwLen<10?2:form.password.match(/[A-Z]/)&&form.password.match(/[0-9]/)?4:3;
  const strColor = ['transparent','#ef4444','#fbbf24','#60a5fa','#10b981'][pwStr];
  const strLabel = ['','Weak','Fair','Good','Strong'][pwStr];

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password.length<6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to Spendly! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const leftFeats = [
    { emoji:'🤖', title:'AI Finance Coach', desc:'Chat with AI that knows your real spending data' },
    { emoji:'📷', title:'Receipt Scanner', desc:'Snap a bill — AI extracts amount & category' },
    { emoji:'⚠️', title:'Anomaly Detector', desc:'Flags unusual spending patterns instantly' },
  ];
  const rightFeats = [
    { emoji:'🧠', title:'Auto Categorize', desc:'AI tags every transaction — no typing needed' },
    { emoji:'🔍', title:'NL Search', desc:'"Show food expenses above ₹500 last month"' },
    { emoji:'📊', title:'Monthly AI Report', desc:'One-click financial report with savings tips' },
  ];

  return (
    <div style={{
      minHeight:'100vh',width:'100%',
      fontFamily:"'DM Sans',sans-serif",
      background:'linear-gradient(145deg,#080c14 0%,#0a1220 40%,#080e18 70%,#0c0816 100%)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      position:'relative',overflow:'hidden',padding:'24px 20px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drawLine{to{stroke-dashoffset:0}}
        @keyframes fA{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
        @keyframes fB{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fC{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
        @keyframes fD{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes orbA{0%,100%{transform:scale(1)}50%{transform:scale(1.1) translate(15px,-10px)}}
        @keyframes orbB{0%,100%{transform:scale(1)}50%{transform:scale(.9) translate(-12px,12px)}}
        @keyframes rDrift{0%,100%{transform:translateY(0) rotate(-3deg);opacity:.07}50%{transform:translateY(-16px) rotate(5deg);opacity:.14}}
        @keyframes gridAn{to{stroke-dashoffset:-300}}

        .ri2{width:100%;padding:13px 16px;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.07);border-radius:11px;color:#eaeaf2;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:all .3s;box-sizing:border-box}
        .ri2:focus{border-color:rgba(16,185,129,.5);background:rgba(16,185,129,.03);box-shadow:0 0 0 3px rgba(16,185,129,.06)}
        .ri2::placeholder{color:rgba(255,255,255,.15)}
        .rb2{width:100%;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px}
        .rb2:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(16,185,129,.25)}
        .rb2:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .rl2{font-size:12px;font-weight:500;color:rgba(255,255,255,.35);margin-bottom:7px;display:block;transition:color .25s}
        .rl2.on{color:#10b981}
        .fc2{position:absolute;background:rgba(14,14,22,.75);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px 16px;box-shadow:0 8px 28px rgba(0,0,0,.35);z-index:1;pointer-events:none}
        .sf2{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.045);border-radius:12px;padding:14px 16px;transition:all .3s;cursor:default}
        .sf2:hover{background:rgba(16,185,129,.03);border-color:rgba(16,185,129,.12);transform:translateY(-2px)}
        @media(max-width:1100px){.sc2{display:none!important}.fc2{display:none!important}.mr2{max-width:440px!important}}
      `}</style>

      {/* BG orbs */}
      <div style={{position:'absolute',top:'-12%',left:'-8%',width:520,height:520,borderRadius:'50%',background:'radial-gradient(circle,rgba(16,185,129,.09) 0%,transparent 60%)',filter:'blur(70px)',animation:'orbA 13s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'-16%',right:'-8%',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,.06) 0%,transparent 60%)',filter:'blur(70px)',animation:'orbB 15s ease-in-out infinite'}}/>

      {/* Grid */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.05}} preserveAspectRatio="none">
        <defs><pattern id="rg2" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(16,185,129,.3)" strokeWidth=".5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#rg2)"/>
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="rgba(16,185,129,.12)" strokeWidth=".5" strokeDasharray="8 20" style={{animation:'gridAn 12s linear infinite'}}/>
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="rgba(139,92,246,.08)" strokeWidth=".5" strokeDasharray="8 24" style={{animation:'gridAn 16s linear infinite reverse'}}/>
      </svg>

      {/* Chart lines */}
      <svg style={{position:'absolute',bottom:0,left:0,width:'100%',height:'40%',opacity:.04}} viewBox="0 0 1400 400" preserveAspectRatio="none">
        <polyline points="0,370 100,330 200,350 300,280 400,300 500,230 600,250 700,180 800,200 900,140 1000,160 1100,100 1200,120 1300,70 1400,50" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2500" strokeDashoffset="2500" style={{animation:'drawLine 4s ease forwards'}}/>
        <polyline points="0,390 100,370 200,360 300,340 400,325 500,300 600,310 700,275 800,260 900,235 1000,220 1100,195 1200,180 1300,165 1400,155" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2500" strokeDashoffset="2500" style={{animation:'drawLine 4s ease .6s forwards'}}/>
      </svg>

      {/* Floating ₹ */}
      {[{x:'6%',y:'12%',s:42,d:0},{x:'92%',y:'8%',s:34,d:1.3},{x:'3%',y:'78%',s:26,d:.7},{x:'94%',y:'72%',s:36,d:2},{x:'18%',y:'48%',s:20,d:2.5},{x:'80%',y:'44%',s:24,d:.9},{x:'50%',y:'4%',s:18,d:1.8},{x:'40%',y:'92%',s:22,d:3}].map(({x,y,s,d},i)=>(
        <div key={i} style={{position:'absolute',left:x,top:y,fontSize:s,fontWeight:700,color:'rgba(16,185,129,.07)',fontFamily:"'Playfair Display',serif",animation:`rDrift ${5+d*2}s ease-in-out ${d}s infinite`,userSelect:'none',pointerEvents:'none'}}>₹</div>
      ))}

      {/* Floating cards */}
      <div className="fc2" style={{top:'5%',right:'4%',animation:'fA 5.5s ease-in-out infinite',minWidth:148}}>
        <div style={{fontSize:9,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Receipt Scanned</div>
        <div style={{fontSize:20,fontWeight:700,color:'#fff'}}>₹450</div>
        <div style={{fontSize:10,color:'#fbbf24',marginTop:3}}>📷 Zomato · Food</div>
      </div>
      <div className="fc2" style={{bottom:'6%',right:'3%',animation:'fB 6.5s ease-in-out infinite',minWidth:155}}>
        <div style={{fontSize:9,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Anomaly Alert</div>
        <div style={{fontSize:11,color:'#fbbf24',lineHeight:1.5}}>⚠️ Transport 3x<br/>higher than average</div>
      </div>
      <div className="fc2" style={{top:'6%',left:'3%',animation:'fC 7s ease-in-out .5s infinite',minWidth:165}}>
        <div style={{fontSize:9,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>AI Coach</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,.65)',lineHeight:1.5}}>"Cut dining by 20%<br/>to hit your goal 🎯"</div>
        <div style={{fontSize:9,color:'#10b981',marginTop:5}}>Powered by AI</div>
      </div>
      <div className="fc2" style={{bottom:'5%',left:'3%',animation:'fD 5.5s ease-in-out 1s infinite',minWidth:145}}>
        <div style={{fontSize:9,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:5}}>Savings Goal</div>
        <div style={{fontSize:12,fontWeight:600,color:'#f0f0f8',marginBottom:6}}>Emergency Fund</div>
        <div style={{background:'rgba(255,255,255,.08)',borderRadius:99,height:4}}>
          <div style={{width:'52%',height:'100%',background:'linear-gradient(90deg,#10b981,#34d399)',borderRadius:99}}/>
        </div>
        <div style={{fontSize:9,color:'rgba(255,255,255,.25)',marginTop:4}}>₹26,000 / ₹50,000</div>
      </div>

      {/* ═══ MAIN ═══ */}

      {/* Logo */}
      <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:14,position:'relative',zIndex:2,animation:'fadeUp .5s ease both'}}>
        <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'#fff',boxShadow:'0 6px 20px rgba(16,185,129,.3)'}}>₹</div>
        <div>
          <div style={{fontSize:22,fontWeight:700,color:'#f0f2f5',letterSpacing:'-.3px'}}>Spendly</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,.25)',marginTop:1}}>Personal Finance AI</div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{textAlign:'center',marginBottom:18,position:'relative',zIndex:2,animation:'fadeUp .5s ease .1s both'}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:600,color:'#f0f2f5',lineHeight:1.2,letterSpacing:'-.5px',margin:'0 0 8px'}}>
          Finance tools that <span style={{color:'#10b981'}}>actually think.</span>
        </h1>
        <p style={{fontSize:14,color:'rgba(255,255,255,.28)',lineHeight:1.6,maxWidth:380,margin:'0 auto'}}>
          AI-powered expense tracking, budgets & smart insights — completely free.
        </p>
      </div>

      {/* 3-column: LEFT | FORM | RIGHT */}
      <div className="mr2" style={{
        display:'flex',alignItems:'center',gap:28,
        position:'relative',zIndex:10,width:'100%',maxWidth:960,
        justifyContent:'center',animation:'fadeUp .5s ease .2s both',
      }}>
        {/* LEFT */}
        <div className="sc2" style={{display:'flex',flexDirection:'column',gap:10,width:210,flexShrink:0}}>
          {leftFeats.map(({emoji,title,desc})=>(
            <div key={title} className="sf2">
              <div style={{fontSize:20,marginBottom:8}}>{emoji}</div>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.65)',marginBottom:3}}>{title}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.25)',lineHeight:1.45}}>{desc}</div>
            </div>
          ))}
        </div>

        {/* FORM */}
        <div style={{
          width:'100%',maxWidth:400,flexShrink:0,
          background:'rgba(12,14,22,.75)',backdropFilter:'blur(28px)',
          border:'1px solid rgba(255,255,255,.06)',borderRadius:20,
          padding:'28px 28px',boxShadow:'0 28px 72px rgba(0,0,0,.4)',
        }}>
          <h2 style={{fontSize:21,fontWeight:700,color:'#f0f2f5',letterSpacing:'-.3px',margin:'0 0 3px'}}>Create your account</h2>
          <p style={{color:'rgba(255,255,255,.25)',fontSize:12,margin:'0 0 20px'}}>Free forever. No credit card needed.</p>

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:13}}>
            <div>
              <label className={`rl2 ${focused==='name'?'on':''}`}>Full name</label>
              <input className="ri2" type="text" required placeholder="Your name"
                value={form.name} onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')}
                onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className={`rl2 ${focused==='email'?'on':''}`}>Email address</label>
              <input className="ri2" type="email" required placeholder="you@example.com"
                value={form.email} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label className={`rl2 ${focused==='pw'?'on':''}`}>Password</label>
                {pwLen>0&&<span style={{fontSize:11,color:strColor,fontWeight:600}}>{strLabel}</span>}
              </div>
              <div style={{position:'relative'}}>
                <input className="ri2" type={showPw?'text':'password'} required placeholder="Min 6 characters"
                  value={form.password} onFocus={()=>setFocused('pw')} onBlur={()=>setFocused('')}
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{paddingRight:44}} />
                <button type="button" onClick={()=>setShowPw(s=>!s)} style={{
                  position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                  background:'none',border:'none',color:'rgba(255,255,255,.18)',cursor:'pointer',display:'flex',padding:0,
                }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
              {pwLen>0&&(
                <div style={{display:'flex',gap:4,marginTop:8}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{flex:1,height:3,borderRadius:99,background:pwStr>=i?strColor:'rgba(255,255,255,.06)',transition:'background .3s'}}/>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="rb2" disabled={loading} style={{marginTop:2}}>
              {loading
                ?<div style={{width:17,height:17,border:'2px solid rgba(255,255,255,.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                :<><span>Create account</span><ArrowRight size={15}/></>}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'rgba(255,255,255,.22)'}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'#10b981',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
          </p>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,.04)'}}>
            {['No ads','Private','Free forever'].map(t=>(
              <span key={t} style={{fontSize:10,color:'rgba(255,255,255,.17)',display:'flex',alignItems:'center',gap:4}}>
                <span style={{color:'#10b981',fontSize:9}}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="sc2" style={{display:'flex',flexDirection:'column',gap:10,width:210,flexShrink:0}}>
          {rightFeats.map(({emoji,title,desc})=>(
            <div key={title} className="sf2">
              <div style={{fontSize:20,marginBottom:8}}>{emoji}</div>
              <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,.65)',marginBottom:3}}>{title}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.25)',lineHeight:1.45}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
