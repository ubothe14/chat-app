import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { GoogleLogin } from '@react-oauth/google'

interface RegisteredUser {
  name: string
  email: string
  phone: string
  password?: string
  experience: string
  targetExam: string
  idDocumentName?: string
  verificationStatus: 'unverified' | 'pending' | 'verified'
}

interface AuthPageProps {
  mode: 'login' | 'signup'
  registeredUser: RegisteredUser | null
  onModeChange: (mode: 'login' | 'signup') => void
  onLogin: (identifier: string, password: string) => void
  onSignup: (data: RegisteredUser) => void
  onGoogleSignIn: (token: string) => void
  apiError?: string | null
  isLoading?: boolean
}

/* ─── Inline-styled input so Tailwind conflicts can't break it ─── */
function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '12px',
          border: `1.5px solid ${focused ? '#2979ff' : '#dde3ed'}`,
          background: focused ? '#fff' : '#eef2ff',
          padding: '8px 12px',
          fontSize: '11px',
          lineHeight: '1.4',
          color: '#0f172a',
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(41,121,255,0.12)' : 'none',
          transition: 'all 0.18s ease',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

export default function AuthPage({ mode, registeredUser, onModeChange, onLogin, onSignup, onGoogleSignIn, apiError, isLoading }: AuthPageProps) {
  const [identifier, setIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('')
  const [targetExam, setTargetExam] = useState('All')
  const [idDocumentName, setIdDocumentName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function switchMode(m: 'login' | 'signup') {
    setError('')
    onModeChange(m)
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (!identifier.trim() || !loginPassword.trim()) { setError('Please enter your email/phone and password.'); return }
    setError(''); onLogin(identifier.trim(), loginPassword.trim())
  }

  function handleSignup(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim() || !experience.trim() || !targetExam.trim() || !password.trim() || !idDocumentName.trim()) {
      setError('Please complete all signup fields and upload your ID document.');
      return
    }
    setError('');
    onSignup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      experience: experience.trim(),
      targetExam: targetExam.trim(),
      password: password.trim(),
      idDocumentName: idDocumentName.trim(),
      verificationStatus: 'pending',
    })
  }

  function selectIdDocument() {
    fileInputRef.current?.click()
  }

  function handleIdDocumentFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setIdDocumentName(file.name)
    }
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', borderRadius: '100px', border: 'none',
    background: '#2979ff', padding: '9px',
    fontSize: '12px', fontWeight: 700, color: '#fff',
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 6px 22px rgba(41,121,255,0.30)',
    transition: 'all 0.18s ease', marginTop: '0px',
  }

  return (
    <>
      <style>{`
        @keyframes aSlide { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        .aslide { animation: aSlide 0.24s ease both; }
        *[data-auth] { box-sizing: border-box; }
        .auth-submit:hover { background: #1565e8 !important; transform: translateY(-1px); box-shadow: 0 10px 28px rgba(41,121,255,0.38) !important; }
        .auth-submit:active { transform: translateY(0); }
        .auth-link { background:none; border:none; cursor:pointer; font-family:inherit; color:#2979ff; font-weight:600; font-size:13px; padding:0; }
        .auth-link:hover { text-decoration: underline; }
      `}</style>

      {/* position:fixed fills the entire viewport regardless of parent layout */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#e8eaf6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {/* Card */}
        <div style={{
          display: 'flex', width: '100%', maxWidth: '750px',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 72px rgba(15,23,42,0.16)',
        }}>

          {/* ══ LEFT BLUE PANEL ══ */}
          <div style={{
            width: '42%', flexShrink: 0,
            background: 'linear-gradient(170deg,#3d8eff 0%,#1a6ef5 45%,#0d47d4 100%)',
            padding: '32px 28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position:'absolute',top:'-64px',right:'-64px',width:'230px',height:'230px',borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none' }} />
            <div style={{ position:'absolute',top:'34%',right:'-52px',width:'190px',height:'190px',borderRadius:'50%',background:'rgba(255,255,255,0.055)',pointerEvents:'none' }} />
            <div style={{ position:'absolute',bottom:'-44px',left:'-36px',width:'150px',height:'150px',borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none' }} />

            <div style={{ position:'relative', zIndex:1 }}>
              <span style={{
                display:'inline-block', borderRadius:'100px',
                border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.12)',
                padding:'5px 14px', fontSize:'10px', fontWeight:600,
                letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.75)',
              }}>Socialize</span>
              <h1 style={{ marginTop:'20px', fontSize:'32px', fontWeight:800, lineHeight:1.15, letterSpacing:'-0.02em', color:'#fff' }}>
                Connect and chat,<br />effortlessly.
              </h1>
              <p style={{ marginTop:'14px', fontSize:'13.5px', lineHeight:1.8, color:'rgba(255,255,255,0.65)' }}>
                A clean, modern messaging experience built for seamless conversations. Join thousands already chatting.
              </p>
            </div>

            <div style={{
              position:'relative', zIndex:1,
              borderRadius:'16px', border:'1px solid rgba(255,255,255,0.14)',
              background:'rgba(255,255,255,0.09)', padding:'20px 22px',
            }}>
              <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(255,255,255,0.42)', marginBottom:'12px' }}>
                Why you'll love it
              </p>
              {['Instant message delivery','Clean, distraction-free UI','Secure end-to-end login'].map(item => (
                <div key={item} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'9px' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'rgba(255,255,255,0.45)', flexShrink:0 }} />
                  <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.72)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT WHITE PANEL ══ */}
          <div style={{
            flex: 1, background: '#fff',
            padding: '24px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            overflowY: 'auto',
          }}>

            {/* Tab switcher — BOTH wired to switchMode */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <button
                onClick={() => switchMode('login')}
                style={{
                  borderRadius:'100px', border:'none',
                  padding:'6px 16px', fontSize:'12px', fontWeight:600,
                  color: mode === 'login' ? '#0f172a' : '#64748b',
                  background: mode === 'login' ? '#f1f5f9' : 'transparent',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s',
                }}
              >Sign in</button>
              <button
                onClick={() => switchMode('signup')}
                style={{
                  borderRadius:'100px',
                  border: '2px solid #2979ff',
                  padding:'5px 16px', fontSize:'12px', fontWeight:600,
                  color:'#2979ff',
                  background: mode === 'signup' ? '#eff6ff' : '#fff',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s',
                }}
              >Create account</button>
            </div>

            {/* Animated form */}
            <div key={mode} className="aslide">
              {mode === 'login' ? (
                <>
                  <h2 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.02em', color:'#0f172a', margin:'0 0 1px' }}>Welcome back</h2>
                  <p style={{ fontSize:'11px', color:'#64748b', margin:'0 0 12px' }}>Sign in to continue.</p>

                  {(error || apiError) && (
                    <div style={{ marginBottom:'8px', padding:'8px 12px', borderRadius:'12px', background:'#fef2f2', border:'1px solid #fecaca', fontSize:'10px', color:'#b91c1c', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'14px', height:'14px', borderRadius:'50%', background:'#fecaca', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, flexShrink:0 }}>!</span>
                      {error || apiError}
                    </div>
                  )}

                  <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <Field label="Email or phone" type="text" value={identifier} onChange={setIdentifier} placeholder="name@example.com" />
                    <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="Enter password" />
                    <button type="submit" className="auth-submit" style={btnStyle} disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in →'}</button>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={credentialResponse => {
                          if (credentialResponse.credential) {
                            onGoogleSignIn(credentialResponse.credential)
                          }
                        }}
                        onError={() => {
                          console.log('Login Failed')
                        }}
                        theme="filled_blue"
                        shape="pill"
                        size="medium"
                        width="100%"
                      />
                    </div>
                    <p style={{ textAlign:'center', fontSize:'10px', color:'#94a3b8', margin:0 }}>
                      {registeredUser
                        ? 'Use your registered email or phone.'
                        : <span>No account? <button type="button" className="auth-link" onClick={() => switchMode('signup')}>Create one</button></span>
                      }
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize:'20px', fontWeight:800, letterSpacing:'-0.02em', color:'#0f172a', margin:'0 0 1px' }}>Create account</h2>
                  <p style={{ fontSize:'11px', color:'#64748b', margin:'0 0 12px' }}>Fill in your details below.</p>

                  {(error || apiError) && (
                    <div style={{ marginBottom:'8px', padding:'8px 12px', borderRadius:'12px', background:'#fef2f2', border:'1px solid #fecaca', fontSize:'10px', color:'#b91c1c', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'14px', height:'14px', borderRadius:'50%', background:'#fecaca', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, flexShrink:0 }}>!</span>
                      {error || apiError}
                    </div>
                  )}

                  <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <Field label="Full name" type="text" value={name} onChange={setName} placeholder="Your name" />
                    <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
                    <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                    <Field label="Experience" type="text" value={experience} onChange={setExperience} placeholder="Years or background" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>Target exam</label>
                      <select
                        value={targetExam}
                        onChange={(e) => setTargetExam(e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box', borderRadius: '12px',
                          border: '1.5px solid #dde3ed', background: '#eef2ff', padding: '8px 12px',
                          fontSize: '11px', lineHeight: '1.4', color: '#0f172a', outline: 'none', fontFamily: 'inherit',
                        }}
                      >
                        <option value="All">All</option>
                        <option value="CAT">Only CAT</option>
                        <option value="SNAP">Only SNAP</option>
                        <option value="HSR and related">Only HSR and all related</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>Government ID</label>
                      <button
                        type="button"
                        onClick={selectIdDocument}
                        style={{
                          width:'100%', borderRadius:'12px', border:'1.5px solid #dde3ed',
                          background:'#fff', padding:'8px 12px', textAlign:'left', fontSize:'11px',
                          color:'#0f172a', cursor:'pointer', outline:'none', fontFamily:'inherit',
                        }}
                      >
                        {idDocumentName ? idDocumentName : 'Choose ID document'}
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.jpg,.jpeg,.png" onChange={handleIdDocumentFile} />
                    </div>
                    <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Create strong password" />
                    <button type="submit" className="auth-submit" style={btnStyle} disabled={isLoading}>{isLoading ? 'Creating account...' : 'Create account →'}</button>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={credentialResponse => {
                          if (credentialResponse.credential) {
                            onGoogleSignIn(credentialResponse.credential)
                          }
                        }}
                        onError={() => {
                          console.log('Login Failed')
                        }}
                        theme="filled_blue"
                        shape="pill"
                        size="medium"
                        width="100%"
                      />
                    </div>
                    <p style={{ textAlign:'center', fontSize:'10px', color:'#94a3b8', margin:0 }}>
                      Already have an account? <button type="button" className="auth-link" onClick={() => switchMode('login')}>Sign in</button>
                    </p>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}